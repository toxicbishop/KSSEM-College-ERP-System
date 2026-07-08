module github.com/toxicbishop/kssem-college-erp-system/services/academic

go 1.22

require (
	cloud.google.com/go/firestore v1.22.0
	firebase.google.com/go/v4 v4.20.0
	github.com/google/uuid v1.6.0
	github.com/redis/go-redis/v9 v9.5.1
	github.com/toxicbishop/kssem-college-erp-system/pkg v0.0.0
	google.golang.org/api v0.287.1
	google.golang.org/grpc v1.82.0
	google.golang.org/protobuf v1.36.11
)

replace github.com/toxicbishop/kssem-college-erp-system/pkg => ../../pkg
