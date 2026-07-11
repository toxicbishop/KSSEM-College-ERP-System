package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
)

type contextKey string

const (
	UserContextKey contextKey = "user_context"
)

type UserContext struct {
	UID  string
	Role string
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		ctx := req.Context()
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
			
			userCtx := &UserContext{UID: parts[1], Role: role}
			ctx = context.WithValue(ctx, UserContextKey, userCtx)
			next.ServeHTTP(w, req.WithContext(ctx))
			return
		}

		if firebase.AuthClient == nil {
			logger.Error(ctx, "Firebase Auth not initialized and AUTH_MODE != mock", nil)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		decoded, err := firebase.AuthClient.VerifyIDToken(ctx, token)
		if err != nil {
			logger.Warn(ctx, "Invalid token", "error", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		uid := decoded.UID
		role, _ := decoded.Claims["role"].(string)

		if strings.HasPrefix(req.URL.Path, "/api/admin/") {
			isProfileChangeRequestCreate := req.URL.Path == "/api/admin/profile-change-requests" && req.Method == "POST"
			if isProfileChangeRequestCreate {
				// allowed
			} else if os.Getenv("AUTH_MODE") != "mock" {
				if role != "admin" {
					logger.Warn(ctx, "Forbidden: Non-admin tried to access admin route", "uid", uid)
					http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
					return
				}
			}
		}

		userCtx := &UserContext{UID: uid, Role: role}
		ctx = context.WithValue(ctx, UserContextKey, userCtx)
		next.ServeHTTP(w, req.WithContext(ctx))
	})
}
