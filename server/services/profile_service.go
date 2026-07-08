package services

import (
	"context"

	"cloud.google.com/go/firestore"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetStudentProfile(ctx context.Context, uid string) (*model.StudentProfile, error) {
	doc, err := firebase.Firestore.Collection("student_profiles").Doc(uid).Get(ctx)
	if err != nil {
		return nil, err
	}
	var profile model.StudentProfile
	if err := doc.DataTo(&profile); err != nil {
		return nil, err
	}
	// Make sure UID is set
	profile.UID = uid
	return &profile, nil
}

func UpdateStudentProfile(ctx context.Context, uid string, data model.StudentProfileInput) (*model.StudentProfile, error) {
	updates := map[string]interface{}{}
	if data.Email != nil { updates["email"] = *data.Email }
	if data.Name != nil { updates["name"] = *data.Name }
	if data.PhotoURL != nil { updates["photoUrl"] = *data.PhotoURL }
	if data.PhoneNumber != nil { updates["phoneNumber"] = *data.PhoneNumber }
	if data.Address != nil { updates["address"] = *data.Address }
	if data.DateOfBirth != nil { updates["dateOfBirth"] = *data.DateOfBirth }
	if data.Gender != nil { updates["gender"] = *data.Gender }
	if data.Nationality != nil { updates["nationality"] = *data.Nationality }
	if data.EmergencyContactName != nil { updates["emergencyContactName"] = *data.EmergencyContactName }
	if data.EmergencyContactNumber != nil { updates["emergencyContactNumber"] = *data.EmergencyContactNumber }
	if data.Role != nil { updates["role"] = *data.Role }
	
	_, err := firebase.Firestore.Collection("student_profiles").Doc(uid).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, err
	}

	return GetStudentProfile(ctx, uid)
}
