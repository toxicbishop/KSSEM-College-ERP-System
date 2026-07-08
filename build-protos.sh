#!/bin/bash
set -e
apt-get update && apt-get install -y protobuf-compiler git
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@v2.19.1
export PATH=$PATH:/go/bin

if [ ! -d "third_party/googleapis" ]; then
  mkdir -p third_party
  git clone --depth 1 https://github.com/googleapis/googleapis.git third_party/googleapis
fi

protoc -I . -I third_party/googleapis --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative proto/academic/v1/academic.proto
echo "Protoc generated successfully!"
