FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go.work and module files
COPY go.work go.work.sum ./
COPY pkg/go.mod pkg/go.mod
COPY proto/go.mod proto/go.mod
COPY services/academic/go.mod services/academic/go.mod
COPY services/admin/go.mod services/admin/go.mod
COPY services/communication/go.mod services/communication/go.mod
COPY gateway/go.mod gateway/go.mod

# Download dependencies
WORKDIR /app/services/communication
RUN go mod download
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/communication-service ./services/communication/main.go

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/communication-service .

EXPOSE 8086
EXPOSE 8087

CMD ["/app/communication-service"]
