package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"golang.org/x/time/rate"
)

func TestExtractClientIP(t *testing.T) {
	tests := []struct {
		name     string
		headers  map[string]string
		remote   string
		expected string
	}{
		{
			name:     "X-Forwarded-For takes precedence",
			headers:  map[string]string{"X-Forwarded-For": "203.0.113.195, 70.41.3.18"},
			remote:   "198.51.100.1:1234",
			expected: "203.0.113.195",
		},
		{
			name:     "X-Real-IP when X-Forwarded-For missing",
			headers:  map[string]string{"X-Real-IP": "198.51.100.42"},
			remote:   "198.51.100.1:1234",
			expected: "198.51.100.42",
		},
		{
			name:     "Fallback to RemoteAddr host",
			headers:  map[string]string{},
			remote:   "192.168.1.100:54321",
			expected: "192.168.1.100",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/test", nil)
			req.RemoteAddr = tt.remote
			for k, v := range tt.headers {
				req.Header.Set(k, v)
			}

			ip := ExtractClientIP(req)
			if ip != tt.expected {
				t.Errorf("ExtractClientIP() = %v, want %v", ip, tt.expected)
			}
		})
	}
}

func TestRateLimiterMiddleware(t *testing.T) {
	// 5 requests per second, burst of 2
	limiter := NewIPRateLimiter(rate.Every(time.Second/5), 2)
	handler := limiter.RateLimitMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// First two requests should pass (burst = 2)
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/api/test", nil)
		req.RemoteAddr = "192.0.2.1:1234"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("Request %d failed unexpectedly with status %d", i+1, rec.Code)
		}
	}

	// Third request immediately following should be rate limited (429)
	req := httptest.NewRequest("GET", "/api/test", nil)
	req.RemoteAddr = "192.0.2.1:1234"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected 429 Too Many Requests, got %d", rec.Code)
	}

	// Different IP should still be allowed
	reqOther := httptest.NewRequest("GET", "/api/test", nil)
	reqOther.RemoteAddr = "192.0.2.2:1234"
	recOther := httptest.NewRecorder()
	handler.ServeHTTP(recOther, reqOther)

	if recOther.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for different IP, got %d", recOther.Code)
	}
}
