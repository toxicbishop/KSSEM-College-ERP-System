package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLivenessHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "/health/live", nil)
	rec := httptest.NewRecorder()

	LivenessHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}

	var resp HealthResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	if resp.Status != "live" {
		t.Errorf("Expected status 'live', got %s", resp.Status)
	}

	if resp.Uptime == "" {
		t.Error("Expected non-empty uptime")
	}
}
