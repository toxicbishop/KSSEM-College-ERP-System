FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Use a lightweight alpine image for the final stage
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/server .

# Expose port 8080
EXPOSE 8080

CMD ["./server"]
