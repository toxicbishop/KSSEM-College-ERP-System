proto:
	docker run --rm -v $(PWD):/defs namely/protoc-all:1.51_2 \
	  -d proto \
	  -l go \
	  -o . \
	  --go-source-relative \
	  --with-gateway
	
	# The namely/protoc-all image generates code in a slightly different structure
	# Alternatively, we can use a custom Dockerfile for protoc generation.

# Simpler Docker approach: build a quick protoc image inline or just use standard buf/protoc
proto-docker:
	MSYS_NO_PATHCONV=1 docker run --rm -v /$(CURDIR):/workspace -w //workspace golang:1.22 bash -c "apt-get update && apt-get install -y protobuf-compiler && go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28 && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2 && go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@v2.15.2 && export PATH=\$$PATH:/go/bin && protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative proto/academic/v1/academic.proto proto/admin/v1/admin.proto proto/communication/v1/communication.proto"

verify:
	cd gateway && go build ./...
	cd services/academic && go build ./...
	cd services/communication && go build ./...
	cd services/admin && go build ./...
