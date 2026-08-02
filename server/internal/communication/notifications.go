package communication

import (
	"encoding/json"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
	"google.golang.org/api/iterator"
)

type Notification struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Type      string `json:"type"`
	Timestamp string `json:"timestamp"`
	Read      bool   `json:"read"`
	Link      string `json:"link"`
}

func handleGetNotifications(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserContext)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if firebase.Firestore == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	iter := firebase.Firestore.Collection("users").Doc(user.UID).Collection("notifications").
		OrderBy("timestamp", firestore.Desc).Limit(50).Documents(r.Context())
	defer iter.Stop()

	var notifications []*Notification
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(r.Context(), "Failed to read notifications", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to read notifications")
			return
		}

		data := doc.Data()
		title, _ := data["title"].(string)
		message, _ := data["message"].(string)
		msgType, _ := data["type"].(string)
		read, _ := data["read"].(bool)
		link, _ := data["link"].(string)

		// Properly extract and format the timestamp
		timestampStr := ""
		switch ts := data["timestamp"].(type) {
		case time.Time:
			timestampStr = ts.Format(time.RFC3339)
		case string:
			timestampStr = ts
		}

		notifications = append(notifications, &Notification{
			ID:        doc.Ref.ID,
			Title:     title,
			Message:   message,
			Type:      msgType,
			Timestamp: timestampStr,
			Read:      read,
			Link:      link,
		})
	}

	if notifications == nil {
		notifications = make([]*Notification, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"notifications": notifications})
}

func handleMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if req.ID == "" {
		writeError(w, http.StatusBadRequest, "notification ID is required")
		return
	}

	user, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserContext)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if firebase.Firestore == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	notifRef := firebase.Firestore.Collection("users").Doc(user.UID).Collection("notifications").Doc(req.ID)
	_, err := notifRef.Update(r.Context(), []firestore.Update{
		{Path: "read", Value: true},
	})
	if err != nil {
		logger.Error(r.Context(), "Failed to mark notification as read", "uid", user.UID, "notificationId", req.ID, "error", err)
		writeError(w, http.StatusNotFound, "notification not found or not owned by user")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}
