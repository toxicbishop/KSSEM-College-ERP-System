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
	"firebase.google.com/go/v4/auth"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/middleware"
	academicpb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/admin/v1"
	"github.com/toxicbishop/kssem-college-erp-system/services/admin/internal/handlers"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	ctx := context.Background()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}

	academicSvcAddr := os.Getenv("ACADEMIC_SERVICE_ADDR")
	if academicSvcAddr == "" {
		academicSvcAddr = "localhost:8082" // Local fallback
	}

	logger.Info(ctx, "Starting Admin Service", "port", port)

	var firestoreClient *firestore.Client
	var authClient *auth.Client
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
		authClient, _ = app.Auth(ctx)
		logger.Info(ctx, "Firebase initialized successfully")
	} else {
		logger.Error(ctx, "Firebase init failed", "error", err)
	}

	// Dial Academic Service
	academicConn, err := grpc.NewClient(academicSvcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Error(ctx, "Failed to connect to Academic Service", "error", err)
	}
	academicClient := academicpb.NewAcademicServiceClient(academicConn)

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
	srv := handlers.NewAdminServer(firestoreClient, authClient, academicClient)
	pb.RegisterAdminServiceServer(grpcServer, srv)

	// Setup health endpoint on separate port
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			fmt.Fprint(w, `{"status":"ok"}`)
		})
		healthPort := "8085"
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
