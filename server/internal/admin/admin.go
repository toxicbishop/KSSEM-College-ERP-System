package admin

import (
	"context"
	"encoding/json"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
)

func RegisterRoutes(r chi.Router) {
	r.Route("/admin", func(r chi.Router) {
		r.Get("/users", GetAllUsers)
		r.Post("/users", CreateManagedUser)
		r.Put("/users/{uid}", UpdateManagedUser)
		r.Delete("/users/{uid}", DeleteManagedUser)
		r.Get("/audit-logs", GetAuditLogs)
		r.Get("/settings/system", GetSystemSettings)
		r.Put("/settings/system", UpdateSystemSettings)

		// Profile Change Requests
		r.Post("/profile-change-requests", CreateProfileChangeRequest)
		r.Get("/profile-change-requests", GetProfileChangeRequests)
		r.Post("/profile-change-requests/{id}/approve", ApproveProfileChangeRequest)
		r.Post("/profile-change-requests/{id}/deny", DenyProfileChangeRequest)
	})
}

func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]string{"error": message})
}

func writeAuditLog(ctx context.Context, action string, entity string, entityId string, performedBy string, details string) {
	if firebase.Firestore == nil {
		return
	}
	if performedBy == "" {
		performedBy = "system"
	}

	logEntry := map[string]interface{}{
		"action":      action,
		"entity":      entity,
		"entityId":    entityId,
		"performedBy": performedBy,
		"details":     details,
		"timestamp":   firestore.ServerTimestamp,
	}

	_, _, err := firebase.Firestore.Collection("auditLogs").Add(ctx, logEntry)
	if err != nil {
		logger.Error(ctx, "Failed to write audit log", "error", err)
	}
}

// Handler implementations to follow
