package academic

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router) {
	r.Route("/academic", func(r chi.Router) {
		// Profile
		r.Get("/profile/{uid}", GetStudentProfile)
		r.Put("/profile/{uid}", UpdateStudentProfile)
		r.Get("/profiles", ListStudentProfiles)
		r.Post("/profile/{uid}", CreateStudentProfile)
		r.Delete("/profile/{uid}", DeleteStudentProfile)

		// Attendance
		r.Get("/attendance/student/{studentId}", GetAttendanceRecords)
		r.Post("/attendance", SubmitLectureAttendance)
		r.Get("/attendance/lecture", GetLectureAttendanceForDate) // expects ?date=&classroomId=
		r.Get("/attendance/lecture/range", GetLectureAttendanceForDateRange)

		// Classroom
		r.Get("/classrooms", GetClassroomsByFaculty) // expects ?facultyId=
		r.Post("/classrooms", CreateClassroom)
		r.Get("/classrooms/{classroomId}/students", GetStudentsInClassroom)
		r.Post("/classrooms/{classroomId}/students", AddStudentsToClassroom)
		r.Delete("/classrooms/{classroomId}/students", RemoveStudentFromClassroom)

		// Events
		r.Get("/events", GetAcademicCalendarEvents)

		// Grades
		r.Post("/grades", UpdateStudentGrade)
	})
}

// WriteJSON sends a JSON response
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// WriteError sends a JSON error
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]string{"error": message})
}
