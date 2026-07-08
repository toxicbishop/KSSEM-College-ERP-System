package academic

import (
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"google.golang.org/api/iterator"
)

type AcademicEvent struct {
	Id          string `json:"id" firestore:"-"`
	Title       string `json:"title" firestore:"title"`
	Date        string `json:"date" firestore:"date"`
	Description string `json:"description" firestore:"description"`
	Type        string `json:"type" firestore:"type"`
}

func GetAcademicCalendarEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	var events []AcademicEvent
	iter := firebase.Firestore.Collection("academic_events").OrderBy("date", firestore.Asc).Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var ev AcademicEvent
		if err := doc.DataTo(&ev); err != nil {
			continue
		}
		ev.Id = doc.Ref.ID
		events = append(events, ev)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}
