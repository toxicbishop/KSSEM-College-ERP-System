package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"encoding/base64"

	firestore "cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	projectID := os.Getenv("FIRESTORE_PROJECT_ID")
	b64Creds := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS_B64")
	
	var client *firestore.Client
	var err error

	if b64Creds != "" {
		credsJSON, _ := base64.StdEncoding.DecodeString(b64Creds)
		client, err = firestore.NewClient(ctx, projectID, option.WithCredentialsJSON(credsJSON))
	} else {
		client, err = firestore.NewClient(ctx, projectID)
	}
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	iter := client.Collection("users").Limit(1).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Fatalf("Failed to iterate: %v", err)
		}
		fmt.Printf("Found user UID: %s\n", doc.Ref.ID)
		
		// Print its data to see the field case
		data := doc.Data()
		for k, v := range data {
			fmt.Printf("  %s: %v\n", k, v)
		}
	}
}
