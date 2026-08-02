package academic

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"google.golang.org/api/iterator"
)

type AttendanceRecord struct {
	Id           string `json:"id" firestore:"-"`
	StudentId    string `json:"studentId" firestore:"studentId"`
	LectureId    string `json:"lectureId" firestore:"lectureId"`
	CourseId     string `json:"courseId" firestore:"courseId"`
	ClassroomId  string `json:"classroomId" firestore:"classroomId"`
	Date         string `json:"date" firestore:"date"`
	Status       string `json:"status" firestore:"status"`
	Timestamp    string `json:"timestamp" firestore:"timestamp"`
}

type LectureAttendanceRecord struct {
	LectureId       string             `json:"lectureId"`
	CourseId        string             `json:"courseId"`
	ClassroomId     string             `json:"classroomId"`
	Date            string             `json:"date"`
	TotalStudents   int32              `json:"totalStudents"`
	PresentStudents int32              `json:"presentStudents"`
	AbsentStudents  int32              `json:"absentStudents"`
	Attendance      []AttendanceRecord `json:"attendance"`
}

// validStatuses defines the allowed attendance status values.
var validStatuses = map[string]bool{
	"present": true,
	"absent":  true,
	"late":    true,
	"excused": true,
}

func GetAttendanceRecords(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	caller, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	studentId := chi.URLParam(r, "studentId")

	if studentId == "me" || studentId == "" {
		studentId = caller.UID
	} else if caller.UID != studentId && caller.Role != "admin" && caller.Role != "faculty" {
		WriteError(w, http.StatusForbidden, "cannot view attendance for another student")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("attendance").
		Where("studentId", "==", studentId).
		OrderBy("date", firestore.Desc).
		Documents(ctx)
	defer iter.Stop()

	var records []AttendanceRecord
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate attendance records", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to read records")
			return
		}
		var rec AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			continue
		}
		rec.Id = doc.Ref.ID
		records = append(records, rec)
	}

	if records == nil {
		records = make([]AttendanceRecord, 0)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"records": records})
}

func SubmitLectureAttendance(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if _, err := auth.RequireRole(ctx, "faculty"); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	// Accept a batch of attendance records for a single lecture
	var req struct {
		ClassroomId string             `json:"classroomId"`
		LectureId   string             `json:"lectureId"`
		CourseId    string             `json:"courseId"`
		Date        string             `json:"date"`
		Records     []AttendanceRecord `json:"records"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.ClassroomId == "" || req.Date == "" {
		WriteError(w, http.StatusBadRequest, "classroomId and date are required")
		return
	}

	now := time.Now().Format(time.RFC3339)

	// Use a batch write for efficiency
	batch := firebase.Firestore.Batch()
	var savedIDs []string

	for i := range req.Records {
		rec := &req.Records[i]

		// Validate status
		statusLower := strings.ToLower(rec.Status)
		if statusLower == "" {
			statusLower = "absent"
		}
		if !validStatuses[statusLower] {
			WriteError(w, http.StatusBadRequest, "invalid status value: must be present, absent, late, or excused")
			return
		}

		id := uuid.New().String()
		rec.Id = id
		rec.Timestamp = now
		rec.Status = statusLower
		rec.ClassroomId = req.ClassroomId

		if req.LectureId != "" {
			rec.LectureId = req.LectureId
		} else {
			rec.LectureId = req.Date + "_" + req.ClassroomId
		}
		if req.CourseId != "" {
			rec.CourseId = req.CourseId
		}
		if rec.Date == "" {
			rec.Date = req.Date
		}

		batch.Set(firebase.Firestore.Collection("attendance").Doc(id), rec)
		savedIDs = append(savedIDs, id)
	}

	if _, err := batch.Commit(ctx); err != nil {
		logger.Error(ctx, "Failed to commit attendance batch", "error", err)
		WriteError(w, http.StatusInternalServerError, "failed to save attendance records")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"saved": len(savedIDs),
	})
}

func GetLectureAttendanceForDate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	date := r.URL.Query().Get("date")
	classroomId := r.URL.Query().Get("classroomId")

	if date == "" || classroomId == "" {
		WriteError(w, http.StatusBadRequest, "date and classroomId are required")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("attendance").
		Where("date", "==", date).
		Where("classroomId", "==", classroomId).
		Documents(ctx)
	defer iter.Stop()

	var records []AttendanceRecord
	present, absent := int32(0), int32(0)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate lecture attendance", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to read records")
			return
		}

		var rec AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			continue
		}
		rec.Id = doc.Ref.ID
		records = append(records, rec)

		statusLower := strings.ToLower(rec.Status)
		if statusLower == "present" {
			present++
		} else if statusLower == "absent" {
			absent++
		}
	}

	if records == nil {
		records = make([]AttendanceRecord, 0)
	}

	res := LectureAttendanceRecord{
		LectureId:       date + "_" + classroomId,
		CourseId:        classroomId,
		ClassroomId:     classroomId,
		Date:            date,
		TotalStudents:   present + absent,
		PresentStudents: present,
		AbsentStudents:  absent,
		Attendance:      records,
	}

	WriteJSON(w, http.StatusOK, res)
}

func GetLectureAttendanceForDateRange(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	classroomId := r.URL.Query().Get("classroomId")
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")

	if classroomId == "" || startDate == "" || endDate == "" {
		WriteError(w, http.StatusBadRequest, "classroomId, startDate, and endDate are required")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	// Firestore composite queries: we query by classroomId and filter by date range in code
	iter := firebase.Firestore.Collection("attendance").
		Where("classroomId", "==", classroomId).
		OrderBy("date", firestore.Asc).
		Documents(ctx)
	defer iter.Stop()

	var records []AttendanceRecord
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate attendance range", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to read records")
			return
		}

		var rec AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			continue
		}

		if rec.Date >= startDate && rec.Date <= endDate {
			rec.Id = doc.Ref.ID
			records = append(records, rec)
		}
	}

	if records == nil {
		records = make([]AttendanceRecord, 0)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"records": records})
}

func DeleteLectureAttendance(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if _, err := auth.RequireRole(ctx, "faculty"); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	classroomId := r.URL.Query().Get("classroomId")
	date := r.URL.Query().Get("date")

	if classroomId == "" || date == "" {
		WriteError(w, http.StatusBadRequest, "classroomId and date are required")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("attendance").
		Where("classroomId", "==", classroomId).
		Where("date", "==", date).
		Documents(ctx)
	defer iter.Stop()

	batch := firebase.Firestore.Batch()
	count := 0
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate attendance for deletion", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to find records")
			return
		}
		batch.Delete(doc.Ref)
		count++
	}

	if count == 0 {
		WriteError(w, http.StatusNotFound, "no attendance records found for the given date and classroom")
		return
	}

	if _, err := batch.Commit(ctx); err != nil {
		logger.Error(ctx, "Failed to commit attendance deletion", "error", err)
		WriteError(w, http.StatusInternalServerError, "failed to delete records")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"deleted": count})
}
