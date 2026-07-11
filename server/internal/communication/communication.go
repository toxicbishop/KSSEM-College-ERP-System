package communication

import (
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
)

type ChatMessage struct {
	ID          string    `json:"id"`
	ClassroomID string    `json:"classroomId"`
	SenderID    string    `json:"senderId"`
	SenderName  string    `json:"senderName"`
	Text        string    `json:"text"`
	Timestamp   time.Time `json:"timestamp"`
}

type Hub struct {
	mu              sync.RWMutex
	chatSubscribers map[string]map[chan *ChatMessage]struct{}
}

func NewHub() *Hub {
	return &Hub{
		chatSubscribers: make(map[string]map[chan *ChatMessage]struct{}),
	}
}

func (h *Hub) Subscribe(classroomId string) chan *ChatMessage {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.chatSubscribers[classroomId] == nil {
		h.chatSubscribers[classroomId] = make(map[chan *ChatMessage]struct{})
	}
	ch := make(chan *ChatMessage, 32)
	h.chatSubscribers[classroomId][ch] = struct{}{}
	return ch
}

func (h *Hub) Unsubscribe(classroomId string, ch chan *ChatMessage) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if subs, ok := h.chatSubscribers[classroomId]; ok {
		delete(subs, ch)
		close(ch)
		if len(subs) == 0 {
			delete(h.chatSubscribers, classroomId)
		}
	}
}

func (h *Hub) Broadcast(msg *ChatMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if subs, ok := h.chatSubscribers[msg.ClassroomID]; ok {
		for ch := range subs {
			select {
			case ch <- msg:
			default:
				// If the channel is full, we skip to avoid blocking the broadcast
			}
		}
	}
}

var hub = NewHub()

func RegisterRoutes(r chi.Router) {
	r.Route("/communication", func(r chi.Router) {
		r.Post("/chat/send", handleSendChatMessage)
		r.Get("/chat/messages", handleGetChatMessages)
		r.Get("/chat/stream", handleStreamChatMessages)

		r.Get("/notifications", handleGetNotifications)
		r.Post("/notifications/read", handleMarkNotificationRead)
	})
}
