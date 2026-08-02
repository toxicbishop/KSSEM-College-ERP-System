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
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"google.golang.org/api/iterator"
)

type Grade struct {
	Id           string  `json:"id" firestore:"-"`
	StudentId    string  `json:"studentId" firestore:"studentId"`
	CourseId     string  `json:"courseId" firestore:"courseId"`
	CourseName   string  `json:"courseName" firestore:"courseName"`
	Grade        string  `json:"grade" firestore:"grade"`
	Score        float64 `json:"score" firestore:"score"`
	MaxScore     float64 `json:"maxScore" firestore:"maxScore"`
	Semester     string  `json:"semester" firestore:"semester"`
	AcademicYear string  `json:"academicYear" firestore:"academicYear"`
	Timestamp    string  `json:"timestamp" firestore:"timestamp"`
}

var GradeEventCallback func(studentId, courseName, grade string)

// validGradeValues defines the allowed grade letter values.
var validGradeValues = map[string]bool{
	"O": true, "A+": true, "A": true, "B+": true, "B": true,
	"C+": true, "C": true, "D": true, "F": true,
	"AP": true, "AB": true, "": true, // empty is allowed for pending grades
}

func UpdateStudentGrade(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if _, err := auth.RequireRole(ctx, "faculty"); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	var reqData struct {
		Grade Grade `json:"grade"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	grade := reqData.Grade

	// Validate required fields
	if grade.StudentId == "" {
		WriteError(w, http.StatusBadRequest, "studentId is required")
		return
	}
	if grade.CourseId == "" {
		WriteError(w, http.StatusBadRequest, "courseId is required")
		return
	}

	// Validate grade value
	if !validGradeValues[grade.Grade] {
		WriteError(w, http.StatusBadRequest, "invalid grade value")
		return
	}

	// Validate score range
	if grade.MaxScore > 0 && grade.Score > grade.MaxScore {
		WriteError(w, http.StatusBadRequest, "score cannot exceed maxScore")
		return
	}
	if grade.Score < 0 {
		WriteError(w, http.StatusBadRequest, "score cannot be negative")
		return
	}

	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)

	grade.Id = id
	grade.Timestamp = timestamp

	_, err := firebase.Firestore.Collection("grades").Doc(id).Set(ctx, grade)
	if err != nil {
		logger.Error(ctx, "Failed to save grade", "error", err)
		WriteError(w, http.StatusInternalServerError, "failed to save grade")
		return
	}

	// Trigger callback for notification without causing circular imports
	if GradeEventCallback != nil {
		go GradeEventCallback(grade.StudentId, grade.CourseName, grade.Grade)
	}

	WriteJSON(w, http.StatusOK, grade)
}

// GetStudentGrades returns all grades for a specific student.
func GetStudentGrades(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	caller, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	studentId := chi.URLParam(r, "studentId")

	// Students can only view their own grades; faculty/admin can view any
	if caller.UID != studentId && caller.Role != "admin" && caller.Role != "faculty" {
		WriteError(w, http.StatusForbidden, "cannot view grades for another student")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("grades").
		Where("studentId", "==", studentId).
		OrderBy("timestamp", firestore.Desc).
		Documents(ctx)
	defer iter.Stop()

	var grades []Grade
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate grades", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to read grades")
			return
		}
		var g Grade
		if err := doc.DataTo(&g); err != nil {
			continue
		}
		g.Id = doc.Ref.ID
		grades = append(grades, g)
	}

	if grades == nil {
		grades = make([]Grade, 0)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"grades": grades})
}

// GetClassroomGrades returns all grades for students in a specific classroom/course.
func GetClassroomGrades(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if _, err := auth.RequireRole(ctx, "faculty"); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	classroomId := chi.URLParam(r, "classroomId")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("grades").
		Where("courseId", "==", classroomId).
		Documents(ctx)
	defer iter.Stop()

	var grades []Grade
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate classroom grades", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to read grades")
			return
		}
		var g Grade
		if err := doc.DataTo(&g); err != nil {
			continue
		}
		g.Id = doc.Ref.ID
		grades = append(grades, g)
	}

	if grades == nil {
		grades = make([]Grade, 0)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"grades": grades})
}

// DeleteGrade removes a grade record. Only faculty can delete.
func DeleteGrade(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if _, err := auth.RequireRole(ctx, "faculty"); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	gradeId := chi.URLParam(r, "gradeId")
	if gradeId == "" {
		WriteError(w, http.StatusBadRequest, "gradeId is required")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	_, err := firebase.Firestore.Collection("grades").Doc(gradeId).Delete(ctx)
	if err != nil {
		logger.Error(ctx, "Failed to delete grade", "gradeId", gradeId, "error", err)
		WriteError(w, http.StatusNotFound, "grade not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"deleted": true})
}
