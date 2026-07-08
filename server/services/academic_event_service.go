package services

import (
	"context"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetAcademicCalendarEvents(ctx context.Context) ([]*model.AcademicEvent, error) {
	var events []*model.AcademicEvent
	iter := firebase.Firestore.Collection("academic_events").OrderBy("date", firestore.Asc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var ev model.AcademicEvent
		if err := doc.DataTo(&ev); err != nil {
			return nil, err
		}
		ev.ID = doc.Ref.ID
		events = append(events, &ev)
	}
	return events, nil
}
