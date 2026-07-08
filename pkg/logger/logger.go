package logger

import (
	"context"
	"log/slog"
	"os"
)

type correlationIDKey struct{}

// CorrelationIDKey is the context key for correlation IDs
var CorrelationIDKey = correlationIDKey{}

// Logger wraps slog.Logger
type Logger struct {
	*slog.Logger
}

var defaultLogger *Logger

func init() {
	h := slog.NewJSONHandler(os.Stdout, nil)
	defaultLogger = &Logger{slog.New(h)}
}

// WithContext returns a logger that extracts the correlation ID from the context
func WithContext(ctx context.Context) *slog.Logger {
	if ctx == nil {
		return defaultLogger.Logger
	}
	if v, ok := ctx.Value(CorrelationIDKey).(string); ok {
		return defaultLogger.With("correlation_id", v)
	}
	return defaultLogger.Logger
}

// Info logs at LevelInfo with context
func Info(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Info(msg, args...)
}

// Error logs at LevelError with context
func Error(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Error(msg, args...)
}

// Warn logs at LevelWarn with context
func Warn(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Warn(msg, args...)
}

// Debug logs at LevelDebug with context
func Debug(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Debug(msg, args...)
}
