package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/go-chi/chi/v5"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/middleware"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/encoding/protojson"

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
					parts := strings.SplitN(token, ":", 2)
					if len(parts) != 2 || !strings.HasPrefix(parts[0], "mock-") || parts[1] == "" {
						http.Error(w, "Unauthorized: invalid mock token", http.StatusUnauthorized)
						return
					}
					role := strings.TrimPrefix(parts[0], "mock-")
					if strings.HasPrefix(req.URL.Path, "/api/admin/") && role != "admin" {
						http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
						return
					}
					logger.Warn(ctx, "AUTH_MODE=mock enabled", "uid", parts[1], "role", role)
					req.Header.Set("X-User-Id", parts[1])
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

				// Admin Authorization Check — most /api/admin/* routes require admin role.
				// Exception: students may POST to /api/admin/profile-change-requests to create
				// their own change requests (the admin service itself validates the field whitelist
				// and enforces that the UID from X-User-Id matches the request's user_id).
				if strings.HasPrefix(req.URL.Path, "/api/admin/") {
					isProfileChangeRequestCreate := req.URL.Path == "/api/admin/profile-change-requests" && req.Method == "POST"
					if isProfileChangeRequestCreate {
						// Allow any authenticated user to create a request for themselves.
						// The admin service handler validates that the field is allowed
						// and that the old/new values differ.
						// No further action needed — just let the request through.
					} else if os.Getenv("AUTH_MODE") != "mock" {
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
	commConn, err := grpc.NewClient(commAddr, opts...)
	if err != nil {
		logger.Error(ctx, "Failed to create communication streaming client", "error", err)
	}
	commClient := commpb.NewCommunicationServiceClient(commConn)
	r.Get("/api/communication/chat/{classroomID}/stream", func(w http.ResponseWriter, req *http.Request) {
		classroomID := chi.URLParam(req, "classroomID")
		streamCtx, cancel := context.WithCancel(req.Context())
		defer cancel()
		streamCtx = metadata.NewOutgoingContext(streamCtx, metadata.Pairs("x-user-id", req.Header.Get("X-User-Id")))
		stream, streamErr := commClient.StreamChatMessages(streamCtx, &commpb.StreamChatMessagesRequest{ClassroomId: classroomID})
		if streamErr != nil {
			http.Error(w, "Unable to open chat stream", http.StatusBadGateway)
			return
		}
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		fmt.Fprint(w, ": connected\n\n")
		flusher.Flush()
		for {
			message, recvErr := stream.Recv()
			if recvErr != nil {
				if recvErr != io.EOF && req.Context().Err() == nil {
					logger.Warn(req.Context(), "Chat SSE stream closed", "error", recvErr)
				}
				return
			}
			payload, marshalErr := protojson.Marshal(message)
			if marshalErr != nil {
				continue
			}
			fmt.Fprintf(w, "event: message\ndata: %s\n\n", payload)
			flusher.Flush()
		}
	})

	// Mount gwmux to chi router
	r.Mount("/api/", gwmux)

	logger.Info(ctx, "Gateway listening", "port", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		logger.Error(ctx, "Gateway failed", "error", err)
	}
}
