package academic

import (
	"encoding/json"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
	"google.golang.org/api/iterator"
)

type ClassroomStudentInfo struct {
	Uid              string `json:"uid" firestore:"uid"`
	Name             string `json:"name" firestore:"name"`
	Email            string `json:"email" firestore:"email"`
	EnrollmentNumber string `json:"enrollmentNumber" firestore:"enrollmentNumber"`
	SectionOrBatch   string `json:"sectionOrBatch" firestore:"sectionOrBatch"`
}

type Classroom struct {
	Id           string                 `json:"id" firestore:"-"`
	Name         string                 `json:"name" firestore:"name"`
	CourseCode   string                 `json:"courseCode" firestore:"courseCode"`
	FacultyId    string                 `json:"facultyId" firestore:"facultyId"`
	FacultyName  string                 `json:"facultyName" firestore:"facultyName"`
	AcademicYear string                 `json:"academicYear" firestore:"academicYear"`
	Semester     string                 `json:"semester" firestore:"semester"`
	Students     []ClassroomStudentInfo `json:"students" firestore:"students"`
	StudentUids  []string               `json:"-" firestore:"studentUids"`
}

// isClassroomMember checks if the given UID is the owner faculty or a student in the classroom.
func isClassroomMember(data map[string]interface{}, uid string) bool {
	ownerID, _ := data["facultyId"].(string)
	if ownerID == uid {
		return true
	}
	studentUIDs, _ := data["studentUids"].([]interface{})
	for _, id := range studentUIDs {
		if idStr, ok := id.(string); ok && idStr == uid {
			return true
		}
	}
	return false
}

func GetClassroomsByFaculty(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	facultyID := r.URL.Query().Get("facultyId")
	if facultyID == "me" || facultyID == "" {
		facultyID = user.UID
	}

	// Faculty can only list their own classrooms; admin can list any
	if user.UID != facultyID && user.Role != "admin" {
		WriteError(w, http.StatusForbidden, "cannot list classrooms for another faculty")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	var classrooms []Classroom
	iter := firebase.Firestore.Collection("classrooms").Where("facultyId", "==", facultyID).Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to fetch classrooms", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to fetch classrooms")
			return
		}
		var cls Classroom
		if err := doc.DataTo(&cls); err != nil {
			continue
		}
		cls.Id = doc.Ref.ID
		classrooms = append(classrooms, cls)
	}

	if classrooms == nil {
		classrooms = make([]Classroom, 0)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"classrooms": classrooms})
}

// GetStudentClassrooms returns all classrooms a student is enrolled in.
func GetStudentClassrooms(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("classrooms").Documents(ctx)
	defer iter.Stop()

	var classrooms []Classroom
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logger.Error(ctx, "Failed to iterate classrooms", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to fetch classrooms")
			return
		}

		data := doc.Data()
		if isClassroomMember(data, user.UID) {
			var cls Classroom
			if err := doc.DataTo(&cls); err != nil {
				continue
			}
			cls.Id = doc.Ref.ID
			classrooms = append(classrooms, cls)
		}
	}

	if classrooms == nil {
		classrooms = make([]Classroom, 0)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"classrooms": classrooms})
}

func CreateClassroom(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.RequireRole(ctx, "faculty")
	if err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var reqData struct {
		Classroom Classroom `json:"classroom"`
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
	cls := reqData.Classroom
	cls.Id = id
	cls.FacultyId = user.UID

	_, err = firebase.Firestore.Collection("classrooms").Doc(id).Set(ctx, cls)
	if err != nil {
		logger.Error(ctx, "Failed to create classroom", "error", err)
		WriteError(w, http.StatusInternalServerError, "failed to create classroom")
		return
	}
	WriteJSON(w, http.StatusOK, cls)
}

func GetStudentsInClassroom(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	classroomId := chi.URLParam(r, "classroomId")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusNotFound, "classroom not found")
		return
	}

	data := doc.Data()

	// Only the classroom owner (faculty) or an enrolled student can view the roster
	if !isClassroomMember(data, user.UID) && user.Role != "admin" {
		WriteError(w, http.StatusForbidden, "not a member of this classroom")
		return
	}

	var cls Classroom
	if err := doc.DataTo(&cls); err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to parse classroom")
		return
	}

	if cls.Students == nil {
		cls.Students = []ClassroomStudentInfo{}
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{"students": cls.Students})
}

func AddStudentsToClassroom(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	classroomId := chi.URLParam(r, "classroomId")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusNotFound, "classroom not found")
		return
	}

	data := doc.Data()
	ownerID, _ := data["facultyId"].(string)
	if _, err := auth.RequireOwnerOrAdmin(ctx, ownerID); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var reqData struct {
		StudentIds []string `json:"studentIds"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if len(reqData.StudentIds) == 0 {
		WriteError(w, http.StatusBadRequest, "studentIds array cannot be empty")
		return
	}

	var students []ClassroomStudentInfo
	var studentUIDs []string
	for _, id := range reqData.StudentIds {
		studentDoc, err := firebase.Firestore.Collection("users").Doc(id).Get(ctx)
		if err != nil {
			continue // Skip invalid student IDs
		}
		studentData := studentDoc.Data()

		name, _ := studentData["name"].(string)
		email, _ := studentData["email"].(string)
		enroll, _ := studentData["enrollmentNumber"].(string)
		sec, _ := studentData["sectionOrBatch"].(string)

		students = append(students, ClassroomStudentInfo{
			Uid:              id,
			Name:             name,
			Email:            email,
			EnrollmentNumber: enroll,
			SectionOrBatch:   sec,
		})
		studentUIDs = append(studentUIDs, id)
	}

	if len(students) > 0 {
		_, err = firebase.Firestore.Collection("classrooms").Doc(classroomId).Update(ctx, []firestore.Update{
			{Path: "students", Value: firestore.ArrayUnion(students)},
			{Path: "studentUids", Value: firestore.ArrayUnion(studentUIDs)},
		})
		if err != nil {
			logger.Error(ctx, "Failed to add students to classroom", "error", err)
			WriteError(w, http.StatusInternalServerError, "failed to add students")
			return
		}
	}

	// Fetch updated
	updatedDoc, err := firebase.Firestore.Collection("classrooms").Doc(classroomId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to fetch updated classroom")
		return
	}
	var cls Classroom
	updatedDoc.DataTo(&cls)
	cls.Id = updatedDoc.Ref.ID
	WriteJSON(w, http.StatusOK, cls)
}

// RemoveStudentFromClassroom accepts studentId as a path parameter instead of body.
// Route: DELETE /classrooms/{classroomId}/students/{studentUserId}
func RemoveStudentFromClassroom(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	classroomId := chi.URLParam(r, "classroomId")
	studentUserId := chi.URLParam(r, "studentUserId")

	if studentUserId == "" {
		WriteError(w, http.StatusBadRequest, "studentUserId path parameter is required")
		return
	}

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomId).Get(ctx)
	if err != nil {
		WriteError(w, http.StatusNotFound, "classroom not found")
		return
	}

	data := doc.Data()
	ownerID, _ := data["facultyId"].(string)
	if _, err := auth.RequireOwnerOrAdmin(ctx, ownerID); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var cls Classroom
	doc.DataTo(&cls)

	var newStudents []ClassroomStudentInfo
	var newStudentUIDs []string
	for _, st := range cls.Students {
		if st.Uid != studentUserId {
			newStudents = append(newStudents, st)
			newStudentUIDs = append(newStudentUIDs, st.Uid)
		}
	}

	if len(newStudents) == 0 {
		newStudents = []ClassroomStudentInfo{}
	}

	_, err = firebase.Firestore.Collection("classrooms").Doc(classroomId).Update(ctx, []firestore.Update{
		{Path: "students", Value: newStudents},
		{Path: "studentUids", Value: newStudentUIDs},
	})
	if err != nil {
		logger.Error(ctx, "Failed to remove student from classroom", "error", err)
		WriteError(w, http.StatusInternalServerError, "failed to remove student")
		return
	}

	cls.Students = newStudents
	cls.Id = doc.Ref.ID
	WriteJSON(w, http.StatusOK, cls)
}
