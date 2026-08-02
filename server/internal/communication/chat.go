package communication

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
	"fmt"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
)

// Helper: writes JSON errors
func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// checkClassroomAccess returns the UserContext if the user is a member of the classroom, else an error.
// Matches the classroom data model which uses "facultyId" (not "ownerFacultyId").
func checkClassroomAccess(r *http.Request, classroomID string) (*middleware.UserContext, error) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserContext)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	if user.Role == "admin" {
		return user, nil
	}

	if firebase.Firestore == nil {
		return nil, fmt.Errorf("database unavailable")
	}

	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomID).Get(r.Context())
	if err != nil {
		return nil, fmt.Errorf("classroom not found")
	}

	data := doc.Data()

	// The classroom model stores the owner under "facultyId"
	ownerID, _ := data["facultyId"].(string)
	if ownerID == user.UID {
		return user, nil
	}

	// Check invited faculty
	invited, _ := data["invitedFacultyIds"].([]interface{})
	for _, id := range invited {
		if idStr, ok := id.(string); ok && idStr == user.UID {
			return user, nil
		}
	}

	// Check enrolled students
	students, _ := data["studentUids"].([]interface{})
	for _, id := range students {
		if idStr, ok := id.(string); ok && idStr == user.UID {
			return user, nil
		}
	}

	return nil, fmt.Errorf("permission denied")
}

func handleSendChatMessage(w http.ResponseWriter, r *http.Request) {
	if firebase.Firestore == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	var req struct {
		ClassroomID string `json:"classroomId"`
		Text        string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	if req.ClassroomID == "" || strings.TrimSpace(req.Text) == "" {
		writeError(w, http.StatusBadRequest, "classroomId and text are required")
		return
	}

	user, err := checkClassroomAccess(r, req.ClassroomID)
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	text := strings.TrimSpace(req.Text)
	senderName := user.UID
	if profile, err := firebase.Firestore.Collection("users").Doc(user.UID).Get(r.Context()); err == nil {
		if name, ok := profile.Data()["name"].(string); ok && name != "" {
			senderName = name
		}
	}

	now := time.Now().UTC()
	ref, _, err := firebase.Firestore.Collection("classrooms").Doc(req.ClassroomID).Collection("messages").Add(r.Context(), map[string]interface{}{
		"classroomId": req.ClassroomID,
		"senderId":    user.UID,
		"senderName":  senderName,
		"text":        text,
		"timestamp":   now,
	})
	if err != nil {
		logger.Error(r.Context(), "Failed to save chat message", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save message")
		return
	}

	msg := &ChatMessage{
		ID:          ref.ID,
		ClassroomID: req.ClassroomID,
		SenderID:    user.UID,
		SenderName:  senderName,
		Text:        text,
		Timestamp:   now,
	}

	// Broadcast to connected SSE clients
	hub.Broadcast(msg)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msg)
}

func handleGetChatMessages(w http.ResponseWriter, r *http.Request) {
	classroomID := r.URL.Query().Get("classroomId")
	if classroomID == "" {
		writeError(w, http.StatusBadRequest, "classroomId is required")
		return
	}

	if firebase.Firestore == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	if _, err := checkClassroomAccess(r, classroomID); err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	iter := firebase.Firestore.Collection("classrooms").Doc(classroomID).Collection("messages").OrderBy("timestamp", firestore.Asc).Limit(100).Documents(r.Context())
	defer iter.Stop()

	var messages []*ChatMessage
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(r.Context(), "Failed to read chat messages", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to read messages")
			return
		}
		data := doc.Data()
		msg := &ChatMessage{
			ID:          doc.Ref.ID,
			ClassroomID: classroomID,
		}
		msg.SenderID, _ = data["senderId"].(string)
		msg.SenderName, _ = data["senderName"].(string)
		msg.Text, _ = data["text"].(string)
		if timestamp, ok := data["timestamp"].(time.Time); ok {
			msg.Timestamp = timestamp.UTC()
		}
		messages = append(messages, msg)
	}

	if messages == nil {
		messages = make([]*ChatMessage, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"messages": messages})
}

func handleStreamChatMessages(w http.ResponseWriter, r *http.Request) {
	classroomID := r.URL.Query().Get("classroomId")
	if classroomID == "" {
		writeError(w, http.StatusBadRequest, "classroomId is required")
		return
	}

	if _, err := checkClassroomAccess(r, classroomID); err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "Streaming unsupported")
		return
	}

	ch := hub.Subscribe(classroomID)
	defer hub.Unsubscribe(classroomID, ch)

	for {
		select {
		case <-r.Context().Done():
			return
		case msg := <-ch:
			data, err := json.Marshal(msg)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", string(data))
			flusher.Flush()
		}
	}
}
