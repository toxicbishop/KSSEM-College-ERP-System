package admin

import (
	"encoding/json"
	"fmt"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"google.golang.org/api/iterator"
)

type NotificationSettings struct {
	EmailNotifications bool `json:"emailNotifications"`
	SmsNotifications   bool `json:"smsNotifications"`
	ExamAlerts         bool `json:"examAlerts"`
	AttendanceAlerts   bool `json:"attendanceAlerts"`
}

type SystemSettings struct {
	InstitutionName      string                `json:"institutionName"`
	AcademicYear         string                `json:"academicYear"`
	CurrentSemester      string                `json:"currentSemester"`
	MaintenanceMode      bool                  `json:"maintenanceMode"`
	Timezone             string                `json:"timezone"`
	NotificationSettings *NotificationSettings `json:"notificationSettings,omitempty"`
}

func GetSystemSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	doc, err := firebase.Firestore.Collection("settings").Doc("system").Get(ctx)
	if err != nil {
		// Return default settings if not found
		WriteJSON(w, http.StatusOK, SystemSettings{
			InstitutionName:      "KSSEM",
			AcademicYear:         "2023-2024",
			CurrentSemester:      "Odd",
			Timezone:             "UTC",
			NotificationSettings: &NotificationSettings{},
		})
		return
	}

	var settings SystemSettings
	if err := doc.DataTo(&settings); err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to parse settings")
		return
	}

	WriteJSON(w, http.StatusOK, settings)
}

func UpdateSystemSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if _, err := auth.RequireAdmin(ctx); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var req struct {
		Settings SystemSettings `json:"settings"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	settingsMap := map[string]interface{}{
		"institutionName": req.Settings.InstitutionName,
		"academicYear":    req.Settings.AcademicYear,
		"currentSemester": req.Settings.CurrentSemester,
		"maintenanceMode": req.Settings.MaintenanceMode,
		"timezone":        req.Settings.Timezone,
	}

	if req.Settings.NotificationSettings != nil {
		settingsMap["notificationSettings"] = map[string]interface{}{
			"emailNotifications": req.Settings.NotificationSettings.EmailNotifications,
			"smsNotifications":   req.Settings.NotificationSettings.SmsNotifications,
			"examAlerts":         req.Settings.NotificationSettings.ExamAlerts,
			"attendanceAlerts":   req.Settings.NotificationSettings.AttendanceAlerts,
		}
	}

	_, err := firebase.Firestore.Collection("settings").Doc("system").Set(ctx, settingsMap)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to update settings")
		return
	}

	WriteJSON(w, http.StatusOK, req.Settings)
}

// ---------------------------------------------------------------------------
// Profile Change Request Handlers
// ---------------------------------------------------------------------------

var allowedProfileFields = map[string]bool{
	"name":                   true,
	"email":                  true,
	"contactNumber":          true,
	"gender":                 true,
	"permanentAddress":       true,
	"currentAddress":         true,
	"bloodGroup":             true,
	"emergencyContactName":   true,
	"emergencyContactNumber": true,
	"parentEmail":            true,
}

type ProfileChangeRequest struct {
	Id          string `json:"id"`
	UserId      string `json:"userId"`
	UserName    string `json:"userName"`
	UserEmail   string `json:"userEmail"`
	FieldName   string `json:"fieldName"`
	OldValue    string `json:"oldValue"`
	NewValue    string `json:"newValue"`
	RequestedAt string `json:"requestedAt"`
	Status      string `json:"status"`
	AdminNotes  string `json:"adminNotes"`
	ResolvedAt  string `json:"resolvedAt"`
}

func CreateProfileChangeRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req struct {
		UserId    string `json:"userId"`
		FieldName string `json:"fieldName"`
		OldValue  string `json:"oldValue"`
		NewValue  string `json:"newValue"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	if user.UID != req.UserId && user.Role != "admin" {
		WriteError(w, http.StatusForbidden, "cannot create profile change request for another user")
		return
	}

	if !allowedProfileFields[req.FieldName] {
		WriteError(w, http.StatusBadRequest, fmt.Sprintf("field '%s' cannot be changed", req.FieldName))
		return
	}

	if req.OldValue == req.NewValue {
		WriteError(w, http.StatusBadRequest, "old and new values must differ")
		return
	}

	if req.NewValue == "" && (req.FieldName == "name" || req.FieldName == "email" || req.FieldName == "contactNumber") {
		WriteError(w, http.StatusBadRequest, fmt.Sprintf("field '%s' cannot be empty", req.FieldName))
		return
	}

	userDoc, err := firebase.Firestore.Collection("users").Doc(req.UserId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusNotFound, "user not found")
		return
	}
	userData := userDoc.Data()

	userName, _ := userData["name"].(string)
	userEmail, _ := userData["email"].(string)

	requestData := map[string]interface{}{
		"userId":      req.UserId,
		"userName":    userName,
		"userEmail":   userEmail,
		"fieldName":   req.FieldName,
		"oldValue":    req.OldValue,
		"newValue":    req.NewValue,
		"requestedAt": firestore.ServerTimestamp,
		"status":      "pending",
	}

	docRef, _, err := firebase.Firestore.Collection("profileChangeRequests").Add(ctx, requestData)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create profile change request")
		return
	}

	writeAuditLog(ctx, "PROFILE_CHANGE_REQUEST_CREATED", "profileChangeRequest", docRef.ID, user.UID, fmt.Sprintf("User %s requested to change %s", userName, req.FieldName))

	WriteJSON(w, http.StatusOK, map[string]interface{}{"id": docRef.ID})
}

func GetProfileChangeRequests(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("profileChangeRequests").OrderBy("requestedAt", firestore.Desc).Documents(ctx)
	defer iter.Stop()

	var requests []ProfileChangeRequest
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}

		data := doc.Data()
		reqStatus, _ := data["status"].(string)
		userID, _ := data["userId"].(string)

		if user.Role != "admin" && userID != user.UID {
			continue
		}

		requestedAtStr := ""
		if ts, ok := data["requestedAt"].(interface{}); ok {
			requestedAtStr = fmt.Sprintf("%v", ts)
		}

		resolvedAtStr := ""
		if ts, ok := data["resolvedAt"].(interface{}); ok {
			resolvedAtStr = fmt.Sprintf("%v", ts)
		}

		getStr := func(m map[string]interface{}, key string) string {
			if v, ok := m[key].(string); ok {
				return v
			}
			return ""
		}

		requests = append(requests, ProfileChangeRequest{
			Id:          doc.Ref.ID,
			UserId:      userID,
			UserName:    getStr(data, "userName"),
			UserEmail:   getStr(data, "userEmail"),
			FieldName:   getStr(data, "fieldName"),
			OldValue:    getStr(data, "oldValue"),
			NewValue:    getStr(data, "newValue"),
			RequestedAt: requestedAtStr,
			Status:      reqStatus,
			AdminNotes:  getStr(data, "adminNotes"),
			ResolvedAt:  resolvedAtStr,
		})
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"requests": requests})
}

func ApproveProfileChangeRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.RequireAdmin(ctx)
	if err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	reqId := chi.URLParam(r, "id")
	var req struct {
		NewValue   string `json:"newValue"`
		AdminNotes string `json:"adminNotes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	requestDoc, err := firebase.Firestore.Collection("profileChangeRequests").Doc(reqId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusNotFound, "profile change request not found")
		return
	}
	requestData := requestDoc.Data()

	requestStatus, _ := requestData["status"].(string)
	if requestStatus != "pending" {
		WriteError(w, http.StatusBadRequest, "request is already "+requestStatus)
		return
	}

	requestedUserId, _ := requestData["userId"].(string)
	fieldName, _ := requestData["fieldName"].(string)
	newValue, _ := requestData["newValue"].(string)

	if !allowedProfileFields[fieldName] {
		WriteError(w, http.StatusBadRequest, "field is not allowed to be changed")
		return
	}

	approvedValue := req.NewValue
	if approvedValue == "" {
		approvedValue = newValue
	}

	batch := firebase.Firestore.Batch()

	userRef := firebase.Firestore.Collection("users").Doc(requestedUserId)
	batch.Update(userRef, []firestore.Update{{Path: fieldName, Value: approvedValue}})

	requestRef := firebase.Firestore.Collection("profileChangeRequests").Doc(reqId)
	batch.Update(requestRef, []firestore.Update{
		{Path: "status", Value: "approved"},
		{Path: "resolvedAt", Value: firestore.ServerTimestamp},
		{Path: "adminNotes", Value: req.AdminNotes},
	})

	if _, err := batch.Commit(ctx); err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to approve request")
		return
	}

	adminNotes := req.AdminNotes
	if adminNotes == "" {
		adminNotes = fmt.Sprintf("Approved by admin (%s).", user.UID)
	}

	writeAuditLog(ctx, "PROFILE_CHANGE_REQUEST_APPROVED", "profileChangeRequest", reqId, user.UID,
		fmt.Sprintf("Approved %s change request for user %s. Notes: %s", fieldName, requestedUserId, adminNotes))

	WriteJSON(w, http.StatusOK, map[string]interface{}{})
}

func DenyProfileChangeRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.RequireAdmin(ctx)
	if err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	reqId := chi.URLParam(r, "id")
	var req struct {
		AdminNotes string `json:"adminNotes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.AdminNotes == "" {
		WriteError(w, http.StatusBadRequest, "admin notes are required for denial")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	requestDoc, err := firebase.Firestore.Collection("profileChangeRequests").Doc(reqId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusNotFound, "profile change request not found")
		return
	}
	requestData := requestDoc.Data()

	requestStatus, _ := requestData["status"].(string)
	if requestStatus != "pending" {
		WriteError(w, http.StatusBadRequest, "request is already "+requestStatus)
		return
	}

	_, err = firebase.Firestore.Collection("profileChangeRequests").Doc(reqId).Update(ctx, []firestore.Update{
		{Path: "status", Value: "denied"},
		{Path: "resolvedAt", Value: firestore.ServerTimestamp},
		{Path: "adminNotes", Value: req.AdminNotes},
	})
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to deny request")
		return
	}

	writeAuditLog(ctx, "PROFILE_CHANGE_REQUEST_DENIED", "profileChangeRequest", reqId, user.UID,
		fmt.Sprintf("Denied change request: %s. Reason: %s", reqId, req.AdminNotes))

	WriteJSON(w, http.StatusOK, map[string]interface{}{})
}
