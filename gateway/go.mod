module github.com/toxicbishop/kssem-college-erp-system/gateway

go 1.22

require (
	firebase.google.com/go/v4 v4.20.0
	github.com/go-chi/chi/v5 v5.0.12
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.19.1
	github.com/toxicbishop/kssem-college-erp-system/pkg v0.0.0
	golang.org/x/time v0.5.0
	google.golang.org/grpc v1.82.0
	google.golang.org/protobuf v1.36.11
)

replace github.com/toxicbishop/kssem-college-erp-system/pkg => ../pkg
