package communication

import (
	"testing"
	"time"
)

func TestHubSubscribeAndBroadcast(t *testing.T) {
	h := NewHub()
	classroomId := "class-cse-2026"

	ch1 := h.Subscribe(classroomId)
	defer h.Unsubscribe(classroomId, ch1)

	ch2 := h.Subscribe(classroomId)
	defer h.Unsubscribe(classroomId, ch2)

	msg := &ChatMessage{
		ID:          "msg-001",
		ClassroomID: classroomId,
		SenderID:    "user-1",
		SenderName:  "Test Faculty",
		Text:        "Welcome to Computer Networks lecture",
		Timestamp:   time.Now().UTC(),
	}

	h.Broadcast(msg)

	// Both subscribers should receive the message
	select {
	case received := <-ch1:
		if received.Text != msg.Text {
			t.Errorf("ch1 expected %s, got %s", msg.Text, received.Text)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Timeout waiting for message on ch1")
	}

	select {
	case received := <-ch2:
		if received.ID != msg.ID {
			t.Errorf("ch2 expected message ID %s, got %s", msg.ID, received.ID)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Timeout waiting for message on ch2")
	}
}

func TestHubUnsubscribe(t *testing.T) {
	h := NewHub()
	classroomId := "class-mech-2026"

	ch := h.Subscribe(classroomId)
	h.Unsubscribe(classroomId, ch)

	// After unregistering, channel should be closed
	_, ok := <-ch
	if ok {
		t.Errorf("Expected unsubscribed channel to be closed")
	}

	// Classroom entry should be cleaned up from map
	h.mu.RLock()
	subs := h.chatSubscribers[classroomId]
	h.mu.RUnlock()

	if subs != nil {
		t.Errorf("Expected classroom subscribers map to be removed when empty")
	}
}
