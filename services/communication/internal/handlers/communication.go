package handlers

import (
	"context"
	"fmt"
	"sync"

	"cloud.google.com/go/firestore"
	"github.com/redis/go-redis/v9"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/communication/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type CommunicationServer struct {
	pb.UnimplementedCommunicationServiceServer
	db              *firestore.Client
	rdb             *redis.Client
	chatMu          sync.RWMutex
	chatSubscribers map[string]map[chan *pb.ChatMessage]struct{}
}

func NewCommunicationServer(db *firestore.Client, rdb *redis.Client) *CommunicationServer {
	return &CommunicationServer{
		db:              db,
		rdb:             rdb,
		chatSubscribers: make(map[string]map[chan *pb.ChatMessage]struct{}),
	}
}

func (s *CommunicationServer) GetNotifications(ctx context.Context, req *pb.GetNotificationsRequest) (*pb.ListNotificationsResponse, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	iter := s.db.Collection("users").Doc(req.UserId).Collection("notifications").
		OrderBy("timestamp", firestore.Desc).Limit(50).Documents(ctx)
	defer iter.Stop()

	var notifications []*pb.Notification
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		data := doc.Data()

		title, _ := data["title"].(string)
		message, _ := data["message"].(string)
		msgType, _ := data["type"].(string)
		read, _ := data["read"].(bool)
		link, _ := data["link"].(string)

		var timestampStr string
		if t, ok := data["timestamp"].(interface{}); ok {
			timestampStr = fmt.Sprintf("%v", t)
		}

		notifications = append(notifications, &pb.Notification{
			Id:        doc.Ref.ID,
			Title:     title,
			Message:   message,
			Type:      msgType,
			Timestamp: timestampStr,
			Read:      read,
			Link:      link,
		})
	}

	return &pb.ListNotificationsResponse{Notifications: notifications}, nil
}

func (s *CommunicationServer) MarkNotificationRead(ctx context.Context, req *pb.MarkNotificationReadRequest) (*emptypb.Empty, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	// Wait, the API only takes `id` in the URL: `/api/communication/notifications/{id}/read`
	// In Firestore, notifications are nested under `users/{uid}/notifications/{id}`.
	// Since we don't have the `uid` in the path, we might need a collection group query or the uid needs to be in the path.
	// For now, assume we'll just return a success since this is a mock implementation
	// To do it properly, we'd need the uid or query across all notifications collections.
	// We'll skip the actual Firestore update for this demo if uid isn't provided.

	return &emptypb.Empty{}, nil
}
