package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

const CorrelationIDHeader = "X-Correlation-ID"

// HTTPCorrelationMiddleware is for the API Gateway
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

// GRPCCorrelationInterceptor is for the downstream services
func GRPCCorrelationInterceptor() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		var corrID string
		
		if md, ok := metadata.FromIncomingContext(ctx); ok {
			if vals := md.Get(CorrelationIDHeader); len(vals) > 0 {
				corrID = vals[0]
			}
		}
		
		if corrID == "" {
			corrID = uuid.New().String()
		}
		
		ctx = context.WithValue(ctx, logger.CorrelationIDKey, corrID)
		return handler(ctx, req)
	}
}
