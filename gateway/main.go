package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"firebase.google.com/go/v4/auth"
	firebase "firebase.google.com/go/v4"
	"github.com/go-chi/chi/v5"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/middleware"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	adminpb "github.com/toxicbishop/kssem-college-erp-system/proto/admin/v1"
	commpb "github.com/toxicbishop/kssem-college-erp-system/proto/communication/v1"
)

func main() {
	ctx := context.Background()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	academicAddr := os.Getenv("ACADEMIC_SVC_ADDR")
	if academicAddr == "" {
		academicAddr = "localhost:8082"
	}

	logger.Info(ctx, "Starting API Gateway", "port", port)

	var authClient *auth.Client
	app, err := firebase.NewApp(ctx, nil)
	if err != nil {
		logger.Warn(ctx, "Firebase init failed, using dummy auth mode", "error", err)
	} else {
		authClient, err = app.Auth(ctx)
		if err != nil {
			logger.Warn(ctx, "Firebase Auth init failed, using dummy auth mode", "error", err)
		}
	}

	r := chi.NewRouter()

	// 1. Correlation Middleware
	r.Use(middleware.HTTPCorrelationMiddleware)

	// 2. Auth Middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			if req.URL.Path == "/health" {
				next.ServeHTTP(w, req)
				return
			}

			authHeader := req.Header.Get("Authorization")
			if !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			
			token := strings.TrimPrefix(authHeader, "Bearer ")
			
			if authClient == nil {
				if os.Getenv("AUTH_MODE") == "mock" {
					logger.Warn(ctx, "AUTH_MODE=mock bypass triggered! Dummy auth activated.", "token", token)
					req.Header.Set("X-User-Id", token)
					next.ServeHTTP(w, req)
					return
				}
				logger.Error(ctx, "Firebase Auth not initialized and AUTH_MODE != mock", nil)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			decoded, err := authClient.VerifyIDToken(ctx, token)
			if err != nil {
				logger.Warn(ctx, "Invalid token", "error", err)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			
			// Attach UID to request header so grpc-gateway can forward it as metadata
			req.Header.Set("X-User-Id", decoded.UID)
			
			// Admin Authorization Check
			if strings.HasPrefix(req.URL.Path, "/api/admin/") {
				if os.Getenv("AUTH_MODE") != "mock" {
					if role, ok := decoded.Claims["role"].(string); !ok || role != "admin" {
						logger.Warn(ctx, "Forbidden: Non-admin tried to access admin route", "uid", decoded.UID)
						http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
						return
					}
				}
			}

			next.ServeHTTP(w, req)
		})
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// Setup grpc-gateway multiplexer
	gwmux := runtime.NewServeMux(
		runtime.WithIncomingHeaderMatcher(func(h string) (string, bool) {
			if h == "X-User-Id" || h == "X-Correlation-Id" {
				return h, true
			}
			return runtime.DefaultHeaderMatcher(h)
		}),
	)
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	
	err = pb.RegisterAcademicServiceHandlerFromEndpoint(ctx, gwmux, academicAddr, opts)
	if err != nil {
		logger.Error(ctx, "Failed to register academic handler", "error", err)
	}

	adminAddr := os.Getenv("ADMIN_SVC_ADDR")
	if adminAddr == "" {
		adminAddr = "localhost:8084"
	}
	err = adminpb.RegisterAdminServiceHandlerFromEndpoint(ctx, gwmux, adminAddr, opts)
	if err != nil {
		logger.Error(ctx, "Failed to register admin handler", "error", err)
	}

	commAddr := os.Getenv("COMMUNICATION_SVC_ADDR")
	if commAddr == "" {
		commAddr = "localhost:8086"
	}
	err = commpb.RegisterCommunicationServiceHandlerFromEndpoint(ctx, gwmux, commAddr, opts)
	if err != nil {
		logger.Error(ctx, "Failed to register communication handler", "error", err)
	}

	// Mount gwmux to chi router
	r.Mount("/api/", gwmux)

	logger.Info(ctx, "Gateway listening", "port", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		logger.Error(ctx, "Gateway failed", "error", err)
	}
}
