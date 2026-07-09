package middleware

import (
	"context"

	"github.com/go-playground/validator/v10"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var validate = validator.New()

// Validatable is an interface for request messages that can be validated
type Validatable interface {
	Validate() error
}

// UnaryValidationInterceptor is a gRPC unary interceptor that validates requests
func UnaryValidationInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// 1. Check if the request implements a custom Validate() method (e.g., from protoc-gen-validate)
	if v, ok := req.(Validatable); ok {
		if err := v.Validate(); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "validation failed: %v", err)
		}
	}

	// 2. Use go-playground/validator for struct-tag based validation
	if err := validate.Struct(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "validation failed: %v", err)
	}

	return handler(ctx, req)
}
