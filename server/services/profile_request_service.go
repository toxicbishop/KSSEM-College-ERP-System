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

func GetProfileChangeRequests(ctx context.Context) ([]*model.ProfileChangeRequest, error) {
	var requests []*model.ProfileChangeRequest
	iter := firebase.Firestore.Collection("profile_change_requests").OrderBy("requestDate", firestore.Desc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var req model.ProfileChangeRequest
		if err := doc.DataTo(&req); err != nil {
			return nil, err
		}
		req.ID = doc.Ref.ID
		requests = append(requests, &req)
	}
	return requests, nil
}

func CreateProfileChangeRequest(ctx context.Context, input model.ProfileChangeRequestInput) (*model.ProfileChangeRequest, error) {
	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)

	req := model.ProfileChangeRequest{
		ID:               id,
		UserID:           input.UserID,
		RequestDate:      timestamp,
		Status:           "Pending",
		RequestedChanges: input.RequestedChanges,
	}

	_, err := firebase.Firestore.Collection("profile_change_requests").Doc(id).Set(ctx, req)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func ApproveProfileChangeRequest(ctx context.Context, id string, adminComments *string) (*model.ProfileChangeRequest, error) {
	return updateProfileChangeRequestStatus(ctx, id, "Approved", adminComments)
}

func DenyProfileChangeRequest(ctx context.Context, id string, adminComments *string) (*model.ProfileChangeRequest, error) {
	return updateProfileChangeRequestStatus(ctx, id, "Denied", adminComments)
}

func updateProfileChangeRequestStatus(ctx context.Context, id string, status string, adminComments *string) (*model.ProfileChangeRequest, error) {
	timestamp := time.Now().Format(time.RFC3339)
	updates := map[string]interface{}{
		"status":     status,
		"reviewDate": timestamp,
	}
	if adminComments != nil {
		updates["adminComments"] = *adminComments
	}

	_, err := firebase.Firestore.Collection("profile_change_requests").Doc(id).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, err
	}

	doc, err := firebase.Firestore.Collection("profile_change_requests").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var req model.ProfileChangeRequest
	doc.DataTo(&req)
	req.ID = doc.Ref.ID
	return &req, nil
}
