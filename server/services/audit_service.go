package services

import (
	"context"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetAuditLogs(ctx context.Context) ([]*model.AuditLog, error) {
	var logs []*model.AuditLog
	iter := firebase.Firestore.Collection("audit_logs").OrderBy("timestamp", firestore.Desc).Limit(100).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var al model.AuditLog
		if err := doc.DataTo(&al); err != nil {
			return nil, err
		}
		al.ID = doc.Ref.ID
		logs = append(logs, &al)
	}
	return logs, nil
}
