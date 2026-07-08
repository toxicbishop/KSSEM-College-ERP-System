package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/redis/go-redis/v9"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/middleware"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/communication/v1"
	"github.com/toxicbishop/kssem-college-erp-system/services/communication/internal/handlers"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
)

func main() {
	ctx := context.Background()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8086"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	logger.Info(ctx, "Starting Communication Service", "port", port)

	// Initialize Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	var firestoreClient *firestore.Client
	var app *firebase.App
	var err error

	if b64 := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS_B64"); b64 != "" {
		creds, decErr := base64.StdEncoding.DecodeString(b64)
		if decErr != nil {
			logger.Error(ctx, "Failed to decode base64 credentials", "error", decErr)
		} else {
			app, err = firebase.NewApp(ctx, nil, option.WithCredentialsJSON(creds))
		}
	} else {
		app, err = firebase.NewApp(ctx, nil)
	}

	if err == nil && app != nil {
		firestoreClient, _ = app.Firestore(ctx)
		logger.Info(ctx, "Firestore initialized successfully")
	} else {
		logger.Error(ctx, "Firebase init failed", "error", err)
	}

	// Setup gRPC server
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		logger.Error(ctx, "Failed to listen", "error", err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.GRPCCorrelationInterceptor()),
	)

	// Register Service
	srv := handlers.NewCommunicationServer(firestoreClient, rdb)
	pb.RegisterCommunicationServiceServer(grpcServer, srv)

	// Start Redis Stream Worker
	go srv.StartWorker(ctx)

	// Setup health endpoint on separate port
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			fmt.Fprint(w, `{"status":"ok"}`)
		})
		healthPort := "8087"
		logger.Info(ctx, "Starting health server", "port", healthPort)
		if err := http.ListenAndServe(":"+healthPort, mux); err != nil {
			logger.Error(ctx, "Health server failed", "error", err)
		}
	}()

	logger.Info(ctx, "gRPC server listening", "address", lis.Addr().String())
	if err := grpcServer.Serve(lis); err != nil {
		logger.Error(ctx, "Failed to serve gRPC", "error", err)
	}
}
