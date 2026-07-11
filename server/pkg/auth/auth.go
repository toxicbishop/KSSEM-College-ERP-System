package auth

import (
	"context"
	"fmt"

	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/middleware"
)

func GetUserContext(ctx context.Context) (*middleware.UserContext, error) {
	val := ctx.Value(middleware.UserContextKey)
	if val == nil {
		return nil, fmt.Errorf("unauthenticated: no user context found")
	}
	userCtx, ok := val.(*middleware.UserContext)
	if !ok {
		return nil, fmt.Errorf("unauthenticated: invalid user context type")
	}
	return userCtx, nil
}

func RequireRole(ctx context.Context, requiredRole string) (*middleware.UserContext, error) {
	user, err := GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	if user.Role != requiredRole && user.Role != "admin" {
		return nil, fmt.Errorf("permission denied: required role: %s", requiredRole)
	}

	return user, nil
}

func RequireAdmin(ctx context.Context) (*middleware.UserContext, error) {
	return RequireRole(ctx, "admin")
}

func RequireOwnerOrAdmin(ctx context.Context, ownerID string) (*middleware.UserContext, error) {
	user, err := GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	if user.UID != ownerID && user.Role != "admin" {
		return nil, fmt.Errorf("permission denied")
	}

	return user, nil
}
