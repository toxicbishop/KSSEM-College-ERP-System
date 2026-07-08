package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetAllAnnouncements(ctx context.Context) ([]*model.Announcement, error) {
	var announcements []*model.Announcement
	iter := firebase.Firestore.Collection("announcements").OrderBy("timestamp", firestore.Desc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var ann model.Announcement
		if err := doc.DataTo(&ann); err != nil {
			return nil, err
		}
		ann.ID = doc.Ref.ID
		announcements = append(announcements, &ann)
	}
	return announcements, nil
}

func CreateAnnouncement(ctx context.Context, input model.AnnouncementInput) (*model.Announcement, error) {
	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)
	if input.Timestamp != nil {
		timestamp = *input.Timestamp
	}

	ann := model.Announcement{
		ID:             id,
		Title:          input.Title,
		Content:        input.Content,
		AuthorID:       input.AuthorID,
		AuthorName:     input.AuthorName,
		Timestamp:      timestamp,
		TargetAudience: input.TargetAudience,
		Attachments:    input.Attachments,
		IsImportant:    input.IsImportant,
		ExpiresAt:      input.ExpiresAt,
	}

	_, err := firebase.Firestore.Collection("announcements").Doc(id).Set(ctx, ann)
	if err != nil {
		return nil, err
	}
	return &ann, nil
}

func UpdateAnnouncement(ctx context.Context, id string, input model.AnnouncementInput) (*model.Announcement, error) {
	updates := map[string]interface{}{
		"title":   input.Title,
		"content": input.Content,
		"authorId": input.AuthorID,
	}
	if input.AuthorName != nil { updates["authorName"] = *input.AuthorName }
	if input.TargetAudience != nil { updates["targetAudience"] = input.TargetAudience }
	if input.Attachments != nil { updates["attachments"] = input.Attachments }
	if input.IsImportant != nil { updates["isImportant"] = *input.IsImportant }
	if input.ExpiresAt != nil { updates["expiresAt"] = *input.ExpiresAt }
	
	_, err := firebase.Firestore.Collection("announcements").Doc(id).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, err
	}

	doc, err := firebase.Firestore.Collection("announcements").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var ann model.Announcement
	doc.DataTo(&ann)
	ann.ID = id
	return &ann, nil
}

func DeleteAnnouncement(ctx context.Context, id string) (*bool, error) {
	_, err := firebase.Firestore.Collection("announcements").Doc(id).Delete(ctx)
	success := err == nil
	return &success, err
}
