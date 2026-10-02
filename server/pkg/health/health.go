package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
)

var startTime = time.Now()

type HealthResponse struct {
	Status    string            `json:"status"`
	Uptime    string            `json:"uptime"`
	Timestamp string            `json:"timestamp"`
	Checks    map[string]string `json:"checks,omitempty"`
}

// LivenessHandler indicates whether the process is alive.
func LivenessHandler(w http.ResponseWriter, r *http.Request) {
	resp := HealthResponse{
		Status:    "live",
		Uptime:    time.Since(startTime).Truncate(time.Second).String(),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// ReadinessHandler checks database and critical external services.
func ReadinessHandler(w http.ResponseWriter, r *http.Request) {
	checks := make(map[string]string)
	isReady := true

	// Check Firestore
	if firebase.Firestore == nil {
		checks["firestore"] = "uninitialized"
		isReady = false
	} else {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		// Attempt a shallow collection metadata check
		it := firebase.Firestore.Collections(ctx)
		_, err := it.Next()
		// iterator.Done means database is reachable and responded (even if empty)
		if err != nil && err.Error() != "no more items in iterator" {
			checks["firestore"] = "unreachable: " + err.Error()
			isReady = false
		} else {
			checks["firestore"] = "connected"
		}
	}

	// Check Firebase Auth
	if firebase.AuthClient == nil {
		checks["auth"] = "uninitialized"
		isReady = false
	} else {
		checks["auth"] = "ready"
	}

	status := "ready"
	httpStatus := http.StatusOK
	if !isReady {
		status = "unhealthy"
		httpStatus = http.StatusServiceUnavailable
	}

	resp := HealthResponse{
		Status:    status,
		Uptime:    time.Since(startTime).Truncate(time.Second).String(),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks:    checks,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	json.NewEncoder(w).Encode(resp)
}
