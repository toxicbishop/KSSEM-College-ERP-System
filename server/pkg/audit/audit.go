package audit

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/worker"
	"google.golang.org/api/iterator"
)

type AuditLog struct {
	ID        string                 `json:"id" firestore:"id"`
	Timestamp time.Time              `json:"timestamp" firestore:"timestamp"`
	ActorUID  string                 `json:"actorUid" firestore:"actorUid"`
	ActorRole string                 `json:"actorRole" firestore:"actorRole"`
	Action    string                 `json:"action" firestore:"action"` // e.g. ROLE_PROMOTED, GRADE_MODIFIED, ATTENDANCE_LOGGED
	TargetDoc string                 `json:"targetDoc" firestore:"targetDoc"`
	IPAddress string                 `json:"ipAddress" firestore:"ipAddress"`
	Details   map[string]interface{} `json:"details" firestore:"details"`
}

// Log records an audit entry asynchronously via the background worker pool.
func Log(actorUID, actorRole, action, targetDoc, ipAddress string, details map[string]interface{}) {
	entry := AuditLog{
		ID:        uuid.New().String(),
		Timestamp: time.Now().UTC(),
		ActorUID:  actorUID,
		ActorRole: actorRole,
		Action:    action,
		TargetDoc: targetDoc,
		IPAddress: ipAddress,
		Details:   details,
	}

	worker.SubmitJob(func(ctx context.Context) error {
		if firebase.Firestore == nil {
			logger.Warn(ctx, "Audit skipped: Firestore is uninitialized", "action", action)
			return nil
		}

		_, err := firebase.Firestore.Collection("audit_logs").Doc(entry.ID).Set(ctx, entry)
		if err != nil {
			logger.Error(ctx, "Failed to persist audit log", "error", err, "action", action)
			return err
		}
		return nil
	})
}

// FetchRecentLogs retrieves the latest audit log entries for administrative inspection.
func FetchRecentLogs(ctx context.Context, limit int) ([]AuditLog, error) {
	if firebase.Firestore == nil {
		return []AuditLog{}, nil
	}

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	iter := firebase.Firestore.Collection("audit_logs").
		OrderBy("timestamp", 2). // 2 = firestore.Desc
		Limit(limit).
		Documents(ctx)

	var logs []AuditLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		var log AuditLog
		if err := doc.DataTo(&log); err == nil {
			logs = append(logs, log)
		}
	}

	return logs, nil
}
