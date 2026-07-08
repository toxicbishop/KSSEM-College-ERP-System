package handlers

import (
	"context"

	"cloud.google.com/go/firestore"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	"google.golang.org/api/iterator"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (s *AcademicServer) GetAcademicCalendarEvents(ctx context.Context, _ *emptypb.Empty) (*pb.ListEventsResponse, error) {
	var events []*pb.AcademicEvent
	iter := s.db.Collection("academic_events").OrderBy("date", firestore.Asc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var ev pb.AcademicEvent
		if err := doc.DataTo(&ev); err != nil {
			return nil, err
		}
		ev.Id = doc.Ref.ID
		events = append(events, &ev)
	}
	return &pb.ListEventsResponse{Events: events}, nil
}
