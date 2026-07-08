package academic

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
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

func UpdateStudentGrade(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	if _, err := auth.RequireRole(ctx, "faculty"); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var reqData struct {
		Grade Grade `json:"grade"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)

	grade := reqData.Grade
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
