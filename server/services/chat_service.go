package services

import (
	"context"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetChatMessages(ctx context.Context, senderID string, receiverID string) ([]*model.ChatMessage, error) {
	var messages []*model.ChatMessage
	
	// Complex query in firestore requires composite index. 
	// For simplicity in this demo migration, we will fetch and filter in memory if needed,
	// or assume a simple query structure.
	iter := firebase.Firestore.Collection("chats").
		Where("senderId", "in", []string{senderID, receiverID}).
		OrderBy("timestamp", firestore.Asc).Documents(ctx)
		
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var msg model.ChatMessage
		if err := doc.DataTo(&msg); err != nil {
			return nil, err
		}
		
		// Filter to ensure it's between these two
		if (msg.SenderID == senderID && msg.ReceiverID == receiverID) || 
		   (msg.SenderID == receiverID && msg.ReceiverID == senderID) {
			msg.ID = doc.Ref.ID
			messages = append(messages, &msg)
		}
	}
	return messages, nil
}
