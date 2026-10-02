package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPRateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     rate.Limit
	burst    int
}

// NewIPRateLimiter creates an in-memory rate limiter per IP/identifier.
// rateLimit is requests per second (e.g. rate.Every(time.Minute / 60)).
// burst is maximum burst allowed.
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		visitors: make(map[string]*visitor),
		rate:     r,
		burst:    b,
	}

	// Periodically clean up stale visitors (older than 3 minutes)
	go limiter.cleanupStaleVisitors(3 * time.Minute)

	return limiter
}

func (i *IPRateLimiter) getVisitor(key string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	v, exists := i.visitors[key]
	if !exists {
		limiter := rate.NewLimiter(i.rate, i.burst)
		i.visitors[key] = &visitor{limiter: limiter, lastSeen: time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

func (i *IPRateLimiter) cleanupStaleVisitors(ttl time.Duration) {
	ticker := time.NewTicker(ttl)
	for range ticker.C {
		i.mu.Lock()
		now := time.Now()
		for key, v := range i.visitors {
			if now.Sub(v.lastSeen) > ttl {
				delete(i.visitors, key)
			}
		}
		i.mu.Unlock()
	}
}

// ExtractClientIP extracts the client IP address from request headers or RemoteAddr.
func ExtractClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}
	}

	// Check X-Real-IP header
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return strings.TrimSpace(xri)
	}

	// Fallback to RemoteAddr
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}

	return r.RemoteAddr
}

// RateLimitMiddleware returns a Chi-compatible middleware enforcing rate limits.
func (i *IPRateLimiter) RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use User UID if authenticated, otherwise client IP
		key := ExtractClientIP(r)
		if user, ok := r.Context().Value(UserContextKey).(*UserContext); ok && user.UID != "" {
			key = "usr:" + user.UID
		}

		limiter := i.getVisitor(key)
		if !limiter.Allow() {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "2")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Too many requests. Please slow down and try again.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}
