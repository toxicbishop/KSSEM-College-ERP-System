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
WORKDIR /app/gateway
RUN go mod download

WORKDIR /app
COPY . .

WORKDIR /app/gateway
RUN go build -o /gateway main.go

FROM gcr.io/distroless/static
COPY --from=builder /gateway /gateway
ENTRYPOINT ["/gateway"]
