package firebase

import (
	"context"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
)

var (
	AuthClient *auth.Client
	Firestore  *firestore.Client
)

func InitFirebase(ctx context.Context) error {
	app, err := firebase.NewApp(ctx, nil)
	if err != nil {
		log.Printf("Firebase NewApp failed (using dummy mode if mock): %v", err)
		return err
	}

	AuthClient, err = app.Auth(ctx)
	if err != nil {
		log.Printf("Firebase Auth init failed: %v", err)
	}

	Firestore, err = app.Firestore(ctx)
	if err != nil {
		log.Printf("Firestore init failed: %v", err)
	}

	return nil
}
