package handlers

import (
	"context"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/auth"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/communication/v1"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *CommunicationServer) checkClassroomAccess(ctx context.Context, classroomID string) (*auth.UserContext, error) {
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	if user.Role == "admin" {
		return user, nil
	}

	doc, err := s.db.Collection("classrooms").Doc(classroomID).Get(ctx)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "classroom not found: %s", classroomID)
	}

	data := doc.Data()
	ownerID, _ := data["ownerFacultyId"].(string)
	if ownerID == user.UID {
		return user, nil
	}

	invited, _ := data["invitedFacultyIds"].([]interface{})
	for _, id := range invited {
		if idStr, ok := id.(string); ok && idStr == user.UID {
			return user, nil
		}
	}

	students, _ := data["studentUids"].([]interface{})
	for _, id := range students {
		if idStr, ok := id.(string); ok && idStr == user.UID {
			return user, nil
		}
	}

	return nil, status.Error(codes.PermissionDenied, "user is not a member of this classroom")
}

func (s *CommunicationServer) SendChatMessage(ctx context.Context, req *pb.SendChatMessageRequest) (*pb.ChatMessage, error) {
	if s.db == nil {
		return nil, status.Error(codes.Unavailable, "Firestore is not initialized")
	}

	if req.ClassroomId == "" || strings.TrimSpace(req.Text) == "" {
		return nil, status.Error(codes.InvalidArgument, "classroom_id and text are required")
	}

	user, err := s.checkClassroomAccess(ctx, req.ClassroomId)
	if err != nil {
		return nil, err
	}

	text := strings.TrimSpace(req.Text)
	senderName := user.UID
	if profile, err := s.db.Collection("users").Doc(user.UID).Get(ctx); err == nil {
		if name, ok := profile.Data()["name"].(string); ok && name != "" {
			senderName = name
		}
	}

	now := time.Now().UTC()
	ref, _, err := s.db.Collection("classrooms").Doc(req.ClassroomId).Collection("messages").Add(ctx, map[string]interface{}{
		"classroomId": req.ClassroomId,
		"senderId":    user.UID,
		"senderName":  senderName,
		"text":        text,
		"timestamp":   now,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "save chat message: %v", err)
	}

	message := &pb.ChatMessage{
		Id:          ref.ID,
		ClassroomId: req.ClassroomId,
		SenderId:    user.UID,
		SenderName:  senderName,
		Text:        text,
		Timestamp:   now.Format(time.RFC3339Nano),
	}
	s.publishChatMessage(message)
	return message, nil
}

func (s *CommunicationServer) GetChatMessages(ctx context.Context, req *pb.GetChatMessagesRequest) (*pb.ListChatMessagesResponse, error) {
	if s.db == nil {
		return nil, status.Error(codes.Unavailable, "Firestore is not initialized")
	}

	if req.ClassroomId == "" {
		return nil, status.Error(codes.InvalidArgument, "classroom_id is required")
	}

	if _, err := s.checkClassroomAccess(ctx, req.ClassroomId); err != nil {
		return nil, err
	}

	limit := int(req.Limit)
	if limit <= 0 || limit > 200 {
		limit = 100
	}

	iter := s.db.Collection("classrooms").Doc(req.ClassroomId).Collection("messages").OrderBy("timestamp", firestore.Asc).Limit(limit).Documents(ctx)
	defer iter.Stop()

	response := &pb.ListChatMessagesResponse{}
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, status.Errorf(codes.Internal, "read chat messages: %v", err)
		}
		data := doc.Data()
		message := &pb.ChatMessage{Id: doc.Ref.ID, ClassroomId: req.ClassroomId}
		message.SenderId, _ = data["senderId"].(string)
		message.SenderName, _ = data["senderName"].(string)
		message.Text, _ = data["text"].(string)
		if timestamp, ok := data["timestamp"].(time.Time); ok {
			message.Timestamp = timestamp.UTC().Format(time.RFC3339Nano)
		}
		response.Messages = append(response.Messages, message)
	}
	return response, nil
}

func (s *CommunicationServer) StreamChatMessages(req *pb.StreamChatMessagesRequest, stream pb.CommunicationService_StreamChatMessagesServer) error {
	if req.ClassroomId == "" {
		return status.Error(codes.InvalidArgument, "classroom_id is required")
	}

	if _, err := s.checkClassroomAccess(stream.Context(), req.ClassroomId); err != nil {
		return err
	}

	updates := make(chan *pb.ChatMessage, 32)
	s.chatMu.Lock()
	if s.chatSubscribers[req.ClassroomId] == nil {
		s.chatSubscribers[req.ClassroomId] = make(map[chan *pb.ChatMessage]struct{})
	}
	s.chatSubscribers[req.ClassroomId][updates] = struct{}{}
	s.chatMu.Unlock()
	defer func() {
		s.chatMu.Lock()
		delete(s.chatSubscribers[req.ClassroomId], updates)
		if len(s.chatSubscribers[req.ClassroomId]) == 0 {
			delete(s.chatSubscribers, req.ClassroomId)
		}
		s.chatMu.Unlock()
	}()
	for {
		select {
		case <-stream.Context().Done():
			return nil
		case message := <-updates:
			if err := stream.Send(message); err != nil {
				return err
			}
		}
	}
}

func (s *CommunicationServer) publishChatMessage(message *pb.ChatMessage) {
	s.chatMu.RLock()
	defer s.chatMu.RUnlock()
	for subscriber := range s.chatSubscribers[message.ClassroomId] {
		select {
		case subscriber <- message:
		default:
		}
	}
}
