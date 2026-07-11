package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
)

const CorrelationIDHeader = "X-Correlation-ID"

func HTTPCorrelationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		corrID := r.Header.Get(CorrelationIDHeader)
		if corrID == "" {
			corrID = uuid.New().String()
		}
		
		ctx := context.WithValue(r.Context(), logger.CorrelationIDKey, corrID)
		
		// Add it to the response header too
		w.Header().Set(CorrelationIDHeader, corrID)
		
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
