package admin

import (
	"encoding/json"
	"fmt"
	"net/http"

	"cloud.google.com/go/firestore"
	fbauth "firebase.google.com/go/v4/auth"
	"github.com/go-chi/chi/v5"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"google.golang.org/api/iterator"
)

// Data Types

type UserData struct {
	Uid             string `json:"uid"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Role            string `json:"role"`
	ProfilePhotoUrl string `json:"profilePhotoUrl"`
	Department      string `json:"department"`
	DateOfBirth     string `json:"dateOfBirth"`
	ContactNumber   string `json:"contactNumber"`
}

type CreateManagedUserReq struct {
	Profile           UserData `json:"profile"`
	TemporaryPassword string   `json:"temporaryPassword"`
}

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if _, err := auth.RequireAdmin(ctx); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("users").Documents(ctx)
	defer iter.Stop()

	var users []UserData
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
		name, _ := data["name"].(string)
		email, _ := data["email"].(string)
		role, _ := data["role"].(string)
		photo, _ := data["profilePhotoUrl"].(string)
		dept, _ := data["department"].(string)
		dob, _ := data["dateOfBirth"].(string)
		contact, _ := data["contactNumber"].(string)

		users = append(users, UserData{
			Uid:             doc.Ref.ID,
			Name:            name,
			Email:           email,
			Role:            role,
			ProfilePhotoUrl: photo,
			Department:      dept,
			DateOfBirth:     dob,
			ContactNumber:   contact,
		})
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}

func CreateManagedUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := auth.RequireAdmin(ctx)
	if err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var req CreateManagedUserReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.AuthClient == nil || firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firebase is not initialized")
		return
	}

	params := (&fbauth.UserToCreate{}).
		Email(req.Profile.Email).
		Password(req.TemporaryPassword).
		DisplayName(req.Profile.Name)

	u, err := firebase.AuthClient.CreateUser(ctx, params)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	uid := u.UID

	if req.Profile.Role == "admin" {
		_ = firebase.AuthClient.SetCustomUserClaims(ctx, uid, map[string]interface{}{"role": "admin"})
	}

	profileData := map[string]interface{}{
		"name":          req.Profile.Name,
		"email":         req.Profile.Email,
		"role":          req.Profile.Role,
		"department":    req.Profile.Department,
		"dateOfBirth":   req.Profile.DateOfBirth,
		"contactNumber": req.Profile.ContactNumber,
	}

	_, err = firebase.Firestore.Collection("users").Doc(uid).Set(ctx, profileData)
	if err != nil {
		// Rollback
		_ = firebase.AuthClient.DeleteUser(ctx, uid)
		WriteError(w, http.StatusInternalServerError, "Failed to create user profile, rolled back")
		return
	}

	writeAuditLog(ctx, "USER_CREATED", "user", uid, userCtx.UID, "Created user: "+req.Profile.Email)

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"uid":             uid,
		"authUserCreated": true,
	})
}

func UpdateManagedUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := auth.RequireAdmin(ctx)
	if err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	uid := chi.URLParam(r, "uid")
	var req struct {
		Profile UserData `json:"profile"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.AuthClient != nil {
		params := (&fbauth.UserToUpdate{}).
			Email(req.Profile.Email).
			DisplayName(req.Profile.Name)
		_, err := firebase.AuthClient.UpdateUser(ctx, uid, params)
		if err != nil {
			logger.Error(ctx, "Failed to update firebase.AuthClient user", "uid", uid, "error", err)
		}

		if req.Profile.Role == "admin" {
			_ = firebase.AuthClient.SetCustomUserClaims(ctx, uid, map[string]interface{}{"role": "admin"})
		} else {
			_ = firebase.AuthClient.SetCustomUserClaims(ctx, uid, map[string]interface{}{})
		}
	}

	if firebase.Firestore != nil {
		updates := map[string]interface{}{
			"name":          req.Profile.Name,
			"email":         req.Profile.Email,
			"role":          req.Profile.Role,
			"department":    req.Profile.Department,
			"dateOfBirth":   req.Profile.DateOfBirth,
			"contactNumber": req.Profile.ContactNumber,
		}
		_, err := firebase.Firestore.Collection("users").Doc(uid).Set(ctx, updates, firestore.MergeAll)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to update profile")
			return
		}
	}

	writeAuditLog(ctx, "USER_UPDATED", "user", uid, userCtx.UID, "Updated user: "+req.Profile.Email)

	WriteJSON(w, http.StatusOK, map[string]interface{}{"profile": req.Profile})
}

func DeleteManagedUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := auth.RequireAdmin(ctx)
	if err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	uid := chi.URLParam(r, "uid")

	if firebase.AuthClient != nil {
		_ = firebase.AuthClient.DeleteUser(ctx, uid)
	}

	if firebase.Firestore != nil {
		_, err := firebase.Firestore.Collection("users").Doc(uid).Delete(ctx)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to delete profile")
			return
		}
	}

	writeAuditLog(ctx, "USER_DELETED", "user", uid, userCtx.UID, "Deleted user")

	WriteJSON(w, http.StatusOK, map[string]interface{}{})
}

type AuditLog struct {
	Id          string `json:"id"`
	Action      string `json:"action"`
	Entity      string `json:"entity"`
	EntityId    string `json:"entityId"`
	PerformedBy string `json:"performedBy"`
	Timestamp   string `json:"timestamp"`
	Details     string `json:"details"`
}

func GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if _, err := auth.RequireAdmin(ctx); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("auditLogs").OrderBy("timestamp", firestore.Desc).Limit(100).Documents(ctx)
	defer iter.Stop()

	var logs []AuditLog
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
		action, _ := data["action"].(string)
		entity, _ := data["entity"].(string)
		entityId, _ := data["entityId"].(string)
		performedBy, _ := data["performedBy"].(string)
		details, _ := data["details"].(string)

		var timestampStr string
		if t, ok := data["timestamp"].(interface{}); ok {
			timestampStr = fmt.Sprintf("%v", t)
		}

		logs = append(logs, AuditLog{
			Id:          doc.Ref.ID,
			Action:      action,
			Entity:      entity,
			EntityId:    entityId,
			PerformedBy: performedBy,
			Timestamp:   timestampStr,
			Details:     details,
		})
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"logs": logs})
}
