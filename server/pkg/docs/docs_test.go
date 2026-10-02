package docs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestOpenAPIRoutes(t *testing.T) {
	r := chi.NewRouter()
	RegisterRoutes(r)

	// Test openapi.json
	reqJSON := httptest.NewRequest("GET", "/docs/openapi.json", nil)
	recJSON := httptest.NewRecorder()
	r.ServeHTTP(recJSON, reqJSON)

	if recJSON.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for /docs/openapi.json, got %d", recJSON.Code)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(recJSON.Body.Bytes(), &parsed); err != nil {
		t.Fatalf("Failed to parse OpenAPI JSON: %v", err)
	}

	if parsed["openapi"] != "3.0.3" {
		t.Errorf("Expected openapi version 3.0.3, got %v", parsed["openapi"])
	}

	// Test HTML docs endpoint
	reqHTML := httptest.NewRequest("GET", "/docs", nil)
	recHTML := httptest.NewRecorder()
	r.ServeHTTP(recHTML, reqHTML)

	if recHTML.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for /docs, got %d", recHTML.Code)
	}

	if !strings.Contains(recHTML.Body.String(), "<title>KSSEM College ERP - Interactive API Reference</title>") {
		t.Errorf("Expected HTML response to contain title tag")
	}
}
