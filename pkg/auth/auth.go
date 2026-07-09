package auth

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// UserContext contains the authenticated user's information
type UserContext struct {
	UID  string
	Role string
}

// GetUserContext extracts user information from the gRPC context
func GetUserContext(ctx context.Context) (*UserContext, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "metadata is not provided")
	}

	uids := md.Get("x-user-id")
	if len(uids) == 0 || uids[0] == "" {
		return nil, status.Error(codes.Unauthenticated, "user identity not provided")
	}

	// Roles are passed via claims in the gateway, but let's assume they are also in headers for now
	// In a real system, the gateway would verify the JWT and pass the role in a header or metadata.
	roles := md.Get("x-user-role")
	role := ""
	if len(roles) > 0 {
		role = roles[0]
	}

	return &UserContext{
		UID:  uids[0],
		Role: role,
	}, nil
}

// RequireRole checks if the user has the required role
func RequireRole(ctx context.Context, requiredRole string) (*UserContext, error) {
	user, err := GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	if user.Role != requiredRole && user.Role != "admin" {
		return nil, status.Errorf(codes.PermissionDenied, "required role: %s", requiredRole)
	}

	return user, nil
}

// RequireAdmin checks if the user is an admin
func RequireAdmin(ctx context.Context) (*UserContext, error) {
	return RequireRole(ctx, "admin")
}

// RequireOwnerOrAdmin checks if the user is the owner of the resource or an admin
func RequireOwnerOrAdmin(ctx context.Context, ownerID string) (*UserContext, error) {
	user, err := GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	if user.UID != ownerID && user.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "permission denied")
	}

	return user, nil
}
