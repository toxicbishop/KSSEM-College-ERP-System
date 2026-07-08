package services

import (
	"context"

	"cloud.google.com/go/firestore"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetSystemSettings(ctx context.Context) (*model.SystemSettings, error) {
	doc, err := firebase.Firestore.Collection("system").Doc("settings").Get(ctx)
	if err != nil {
		return nil, err
	}
	var settings model.SystemSettings
	if err := doc.DataTo(&settings); err != nil {
		return nil, err
	}
	return &settings, nil
}

func UpdateSystemSettings(ctx context.Context, input model.SystemSettingsInput) (*model.SystemSettings, error) {
	updates := map[string]interface{}{}
	if input.MaintenanceMode != nil { updates["maintenanceMode"] = *input.MaintenanceMode }
	if input.AnnouncementBanner != nil { updates["announcementBanner"] = *input.AnnouncementBanner }
	if input.RegistrationOpen != nil { updates["registrationOpen"] = *input.RegistrationOpen }
	if input.ContactEmail != nil { updates["contactEmail"] = *input.ContactEmail }
	
	_, err := firebase.Firestore.Collection("system").Doc("settings").Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, err
	}

	return GetSystemSettings(ctx)
}
