package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"golang.org/x/time/rate"

	"github.com/toxicbishop/kssem-college-erp-system/server/internal/academic"
	"github.com/toxicbishop/kssem-college-erp-system/server/internal/admin"
	"github.com/toxicbishop/kssem-college-erp-system/server/internal/communication"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/health"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/worker"
)

func main() {
	ctx := context.Background()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Info(ctx, "Starting Monolithic Backend", "port", port)

	// Initialize background worker pool (5 workers, queue capacity of 100 jobs)
	workerPool := worker.InitGlobalPool(5, 100)

	// Initialize Firebase & Cloud Firestore
	if err := firebase.InitFirebase(ctx); err != nil {
		logger.Warn(ctx, "Firebase initialization warning", "error", err)
	}

	r := chi.NewRouter()

	// Base Middlewares
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.HTTPCorrelationMiddleware)
	r.Use(middleware.SecurityHeadersMiddleware)

	// In-memory Rate Limiting (120 requests/minute per client IP/user, burst of 30)
	rateLimiter := middleware.NewIPRateLimiter(rate.Every(time.Minute/120), 30)
	r.Use(rateLimiter.RateLimitMiddleware)

	// CORS Setup
	allowedOriginsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	var allowedOrigins []string
	if allowedOriginsStr != "" {
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Correlation-ID"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check endpoints (Liveness & Readiness)
	r.Get("/health", health.LivenessHandler)
	r.Get("/health/live", health.LivenessHandler)
	r.Get("/health/ready", health.ReadinessHandler)

	// Authenticated API routes
	r.Route("/api", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)

		academic.RegisterRoutes(r)
		admin.RegisterRoutes(r)
		communication.RegisterRoutes(r)
	})

	// Configure HTTP Server with strict timeouts
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      60 * time.Second, // 60s accommodates PDF streaming and Server-Sent Events
		IdleTimeout:       120 * time.Second,
	}

	// Channel to listen for OS interrupt and termination signals for Graceful Shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start server in background goroutine
	go func() {
		logger.Info(ctx, "Backend HTTP server listening", "port", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error(ctx, "Server failed unexpectedly", "error", err)
			os.Exit(1)
		}
	}()

	// Block until signal is received
	sig := <-stop
	logger.Info(ctx, "Shutting down server gracefully...", "signal", sig.String())

	// Create shutdown context with 15-second grace period
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Shut down HTTP server (stops accepting new connections and drains active requests)
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "Server forced to shutdown", "error", err)
	}

	// Shut down worker pool (drains background jobs)
	workerPool.Shutdown(5 * time.Second)

	// Close Firestore client connection if open
	if firebase.Firestore != nil {
		_ = firebase.Firestore.Close()
	}

	logger.Info(ctx, "Backend server shutdown cleanly")
}
