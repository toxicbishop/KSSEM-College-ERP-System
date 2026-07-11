package academic

import (
	"encoding/json"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"google.golang.org/api/iterator"
)

type AttendanceRecord struct {
	Id        string `json:"id" firestore:"-"`
	StudentId string `json:"studentId" firestore:"studentId"`
	LectureId string `json:"lectureId" firestore:"lectureId"`
	CourseId  string `json:"courseId" firestore:"courseId"`
	Date      string `json:"date" firestore:"date"`
	Status    string `json:"status" firestore:"status"`
	Timestamp string `json:"timestamp" firestore:"timestamp"`
}

type LectureAttendanceRecord struct {
	LectureId       string             `json:"lectureId"`
	CourseId        string             `json:"courseId"`
	Date            string             `json:"date"`
	TotalStudents   int32              `json:"totalStudents"`
	PresentStudents int32              `json:"presentStudents"`
	AbsentStudents  int32              `json:"absentStudents"`
	Attendance      []AttendanceRecord `json:"attendance"`
}

func GetAttendanceRecords(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	studentId := chi.URLParam(r, "studentId")

	if studentId == "me" || studentId == "" {
		if userCtx, err := auth.GetUserContext(ctx); err == nil {
			studentId = userCtx.UID
		}
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("attendance").Where("studentId", "==", studentId).OrderBy("date", firestore.Desc).Documents(ctx)
	defer iter.Stop()

	var records []AttendanceRecord
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var rec AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			continue
		}
		rec.Id = doc.Ref.ID
		records = append(records, rec)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"records": records})
}

func SubmitLectureAttendance(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req AttendanceRecord
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	id := uuid.New().String()
	req.Id = id
	req.Timestamp = time.Now().Format(time.RFC3339)

	_, err := firebase.Firestore.Collection("attendance").Doc(id).Set(ctx, req)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, req)
}

func GetLectureAttendanceForDate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	date := r.URL.Query().Get("date")
	classroomId := r.URL.Query().Get("classroomId")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("attendance").Where("date", "==", date).Where("classroomId", "==", classroomId).Documents(ctx)
	defer iter.Stop()

	var records []AttendanceRecord
	present, absent := int32(0), int32(0)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}

		var rec AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			continue
		}
		rec.Id = doc.Ref.ID
		records = append(records, rec)
		
		if rec.Status == "Present" {
			present++
		} else {
			absent++
		}
	}

	res := LectureAttendanceRecord{
		LectureId:       date + "_" + classroomId,
		CourseId:        classroomId,
		Date:            date,
		TotalStudents:   present + absent,
		PresentStudents: present,
		AbsentStudents:  absent,
		Attendance:      records,
	}

	WriteJSON(w, http.StatusOK, res)
}

func GetLectureAttendanceForDateRange(w http.ResponseWriter, r *http.Request) {
	// Not implemented in original either
	WriteJSON(w, http.StatusOK, map[string]interface{}{})
}
