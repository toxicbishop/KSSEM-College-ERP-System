package auth

import (
	"context"
	"testing"

	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
)

func TestAuthRequireAdmin(t *testing.T) {
	// Admin user should succeed
	adminCtx := context.WithValue(context.Background(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "admin-123",
		Role: "admin",
	})

	user, err := RequireAdmin(adminCtx)
	if err != nil {
		t.Fatalf("Expected admin to pass, got error: %v", err)
	}
	if user.UID != "admin-123" {
		t.Errorf("Expected UID admin-123, got %s", user.UID)
	}

	// Student user should be denied
	studentCtx := context.WithValue(context.Background(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "student-456",
		Role: "student",
	})

	_, err = RequireAdmin(studentCtx)
	if err == nil {
		t.Fatalf("Expected student to fail RequireAdmin check")
	}

	// Unauthenticated context should fail
	_, err = RequireAdmin(context.Background())
	if err == nil {
		t.Fatalf("Expected unauthenticated context to fail")
	}
}

func TestAuthRequireOwnerOrAdmin(t *testing.T) {
	ownerID := "user-alice"

	// Owner accessing their own resource
	ownerCtx := context.WithValue(context.Background(), middleware.UserContextKey, &middleware.UserContext{
		UID:  ownerID,
		Role: "student",
	})
	if _, err := RequireOwnerOrAdmin(ownerCtx, ownerID); err != nil {
		t.Fatalf("Expected owner to access their own resource, got: %v", err)
	}

	// Admin accessing another user's resource
	adminCtx := context.WithValue(context.Background(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "admin-bob",
		Role: "admin",
	})
	if _, err := RequireOwnerOrAdmin(adminCtx, ownerID); err != nil {
		t.Fatalf("Expected admin to have access, got: %v", err)
	}

	// Third party should be denied
	otherCtx := context.WithValue(context.Background(), middleware.UserContextKey, &middleware.UserContext{
		UID:  "user-charlie",
		Role: "student",
	})
	if _, err := RequireOwnerOrAdmin(otherCtx, ownerID); err == nil {
		t.Fatalf("Expected unauthorized third party to be denied")
	}
}
