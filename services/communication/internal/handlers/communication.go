package handlers

import (
	"context"
	"fmt"
	"sync"

	"cloud.google.com/go/firestore"
	"github.com/redis/go-redis/v9"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/communication/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

// actorUID extracts the caller's UID from gRPC incoming metadata.
// The gateway forwards the Firebase UID via the X-User-Id header.
func actorUID(ctx context.Context) string {
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if values := md.Get("x-user-id"); len(values) > 0 {
			return values[0]
		}
	}
	return "system"
}

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

	if req.Id == "" {
		return nil, status.Errorf(codes.InvalidArgument, "notification ID is required")
	}

	// Derive the caller's UID from gRPC metadata (forwarded by the gateway from
	// the Firebase ID token's UID claim via the X-User-Id header).
	uid := actorUID(ctx)
	if uid == "system" {
		return nil, status.Errorf(codes.Unauthenticated, "user identity not provided")
	}

	// Notifications live under the user-scoped subcollection:
	//   users/{uid}/notifications/{id}
	// We update the document directly since we now know the owner UID.
	notifRef := s.db.Collection("users").Doc(uid).Collection("notifications").Doc(req.Id)
	_, err := notifRef.Update(ctx, map[string]interface{}{
		"read": true,
	})
	if err != nil {
		// If the document doesn't exist or belongs to another user, Firestore
		// will return an error. We surface it as NotFound.
		return nil, status.Errorf(codes.NotFound, "notification not found or not owned by user: %v", err)
	}

	return &emptypb.Empty{}, nil
}
