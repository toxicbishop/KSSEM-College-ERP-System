package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/toxicbishop/kssem-college-erp-system/server/internal/academic"
	"github.com/toxicbishop/kssem-college-erp-system/server/internal/admin"
	"github.com/toxicbishop/kssem-college-erp-system/server/internal/communication"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
)

func main() {
	ctx := context.Background()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Info(ctx, "Starting Monolithic Backend", "port", port)

	// Init Firebase
	if err := firebase.InitFirebase(ctx); err != nil {
		logger.Warn(ctx, "Firebase init issues", "error", err)
	}

	r := chi.NewRouter()

	// Base Middlewares
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.HTTPCorrelationMiddleware)

	// CORS Setup
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"}, // Allows wildcard subdomains for vercel, and local dev
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Correlation-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, 
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// Authenticated API routes
	r.Route("/api", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)

		academic.RegisterRoutes(r)
		admin.RegisterRoutes(r)
		communication.RegisterRoutes(r)
	})

	logger.Info(ctx, "Backend listening", "port", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		logger.Error(ctx, "Backend failed", "error", err)
	}
}
