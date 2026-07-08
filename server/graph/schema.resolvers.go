package graph

import (
	"context"

	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
	"github.com/toxicbishop/kssem-college-erp-system/server/services"
)

// UpdateStudentProfile is the resolver for the updateStudentProfile field.
func (r *mutationResolver) UpdateStudentProfile(ctx context.Context, uid string, profileData model.StudentProfileInput) (*model.StudentProfile, error) {
	return services.UpdateStudentProfile(ctx, uid, profileData)
}

// CreateAnnouncement is the resolver for the createAnnouncement field.
func (r *mutationResolver) CreateAnnouncement(ctx context.Context, announcement model.AnnouncementInput) (*model.Announcement, error) {
	return services.CreateAnnouncement(ctx, announcement)
}

// UpdateAnnouncement is the resolver for the updateAnnouncement field.
func (r *mutationResolver) UpdateAnnouncement(ctx context.Context, id string, announcement model.AnnouncementInput) (*model.Announcement, error) {
	return services.UpdateAnnouncement(ctx, id, announcement)
}

// DeleteAnnouncement is the resolver for the deleteAnnouncement field.
func (r *mutationResolver) DeleteAnnouncement(ctx context.Context, id string) (*bool, error) {
	return services.DeleteAnnouncement(ctx, id)
}

// SubmitLectureAttendance is the resolver for the submitLectureAttendance field.
func (r *mutationResolver) SubmitLectureAttendance(ctx context.Context, studentID string, lectureID string, courseID string, date string, status string) (*model.AttendanceRecord, error) {
	return services.SubmitLectureAttendance(ctx, studentID, lectureID, courseID, date, status)
}

// CreateClassroom is the resolver for the createClassroom field.
func (r *mutationResolver) CreateClassroom(ctx context.Context, classroom model.ClassroomInput) (*model.Classroom, error) {
	return services.CreateClassroom(ctx, classroom)
}

// AddStudentsToClassroom is the resolver for the addStudentsToClassroom field.
func (r *mutationResolver) AddStudentsToClassroom(ctx context.Context, classroomID string, studentIds []string) (*model.Classroom, error) {
	return services.AddStudentsToClassroom(ctx, classroomID, studentIds)
}

// RemoveStudentFromClassroom is the resolver for the removeStudentFromClassroom field.
func (r *mutationResolver) RemoveStudentFromClassroom(ctx context.Context, classroomID string, studentID string) (*model.Classroom, error) {
	return services.RemoveStudentFromClassroom(ctx, classroomID, studentID)
}

// UpdateStudentGrade is the resolver for the updateStudentGrade field.
func (r *mutationResolver) UpdateStudentGrade(ctx context.Context, grade model.GradeInput) (*model.Grade, error) {
	return services.UpdateStudentGrade(ctx, grade)
}

// DeleteStudentGrade is the resolver for the deleteStudentGrade field.
func (r *mutationResolver) DeleteStudentGrade(ctx context.Context, id string) (*bool, error) {
	return services.DeleteStudentGrade(ctx, id)
}

// CreateProfileChangeRequest is the resolver for the createProfileChangeRequest field.
func (r *mutationResolver) CreateProfileChangeRequest(ctx context.Context, request model.ProfileChangeRequestInput) (*model.ProfileChangeRequest, error) {
	return services.CreateProfileChangeRequest(ctx, request)
}

// ApproveProfileChangeRequest is the resolver for the approveProfileChangeRequest field.
func (r *mutationResolver) ApproveProfileChangeRequest(ctx context.Context, id string, adminComments *string) (*model.ProfileChangeRequest, error) {
	return services.ApproveProfileChangeRequest(ctx, id, adminComments)
}

// DenyProfileChangeRequest is the resolver for the denyProfileChangeRequest field.
func (r *mutationResolver) DenyProfileChangeRequest(ctx context.Context, id string, adminComments *string) (*model.ProfileChangeRequest, error) {
	return services.DenyProfileChangeRequest(ctx, id, adminComments)
}

// UpdateSystemSettings is the resolver for the updateSystemSettings field.
func (r *mutationResolver) UpdateSystemSettings(ctx context.Context, settings model.SystemSettingsInput) (*model.SystemSettings, error) {
	return services.UpdateSystemSettings(ctx, settings)
}

// GetStudentProfile is the resolver for the getStudentProfile field.
func (r *queryResolver) GetStudentProfile(ctx context.Context, uid string) (*model.StudentProfile, error) {
	return services.GetStudentProfile(ctx, uid)
}

// GetAllAnnouncements is the resolver for the getAllAnnouncements field.
func (r *queryResolver) GetAllAnnouncements(ctx context.Context) ([]*model.Announcement, error) {
	return services.GetAllAnnouncements(ctx)
}

// GetAcademicCalendarEvents is the resolver for the getAcademicCalendarEvents field.
func (r *queryResolver) GetAcademicCalendarEvents(ctx context.Context) ([]*model.AcademicEvent, error) {
	return services.GetAcademicCalendarEvents(ctx)
}

// GetAttendanceRecords is the resolver for the getAttendanceRecords field.
func (r *queryResolver) GetAttendanceRecords(ctx context.Context, studentID string) ([]*model.AttendanceRecord, error) {
	return services.GetAttendanceRecords(ctx, studentID)
}

// GetLectureAttendanceForDate is the resolver for the getLectureAttendanceForDate field.
func (r *queryResolver) GetLectureAttendanceForDate(ctx context.Context, date string, courseID string) (*model.LectureAttendanceRecord, error) {
	return services.GetLectureAttendanceForDate(ctx, date, courseID)
}

// GetAuditLogs is the resolver for the getAuditLogs field.
func (r *queryResolver) GetAuditLogs(ctx context.Context) ([]*model.AuditLog, error) {
	return services.GetAuditLogs(ctx)
}

// GetChatMessages is the resolver for the getChatMessages field.
func (r *queryResolver) GetChatMessages(ctx context.Context, senderID string, receiverID string) ([]*model.ChatMessage, error) {
	return services.GetChatMessages(ctx, senderID, receiverID)
}

// GetClassroomsByFaculty is the resolver for the getClassroomsByFaculty field.
func (r *queryResolver) GetClassroomsByFaculty(ctx context.Context, facultyID string) ([]*model.Classroom, error) {
	return services.GetClassroomsByFaculty(ctx, facultyID)
}

// GetStudentsInClassroom is the resolver for the getStudentsInClassroom field.
func (r *queryResolver) GetStudentsInClassroom(ctx context.Context, classroomID string) ([]*model.ClassroomStudentInfo, error) {
	return services.GetStudentsInClassroom(ctx, classroomID)
}

// GetGrades is the resolver for the getGrades field.
func (r *queryResolver) GetGrades(ctx context.Context, studentID string) ([]*model.Grade, error) {
	return services.GetGrades(ctx, studentID)
}

// GetGradesForClassroom is the resolver for the getGradesForClassroom field.
func (r *queryResolver) GetGradesForClassroom(ctx context.Context, classroomID string, courseName string) ([]*model.Grade, error) {
	return services.GetGradesForClassroom(ctx, classroomID, courseName)
}

// GetProfileChangeRequests is the resolver for the getProfileChangeRequests field.
func (r *queryResolver) GetProfileChangeRequests(ctx context.Context) ([]*model.ProfileChangeRequest, error) {
	return services.GetProfileChangeRequests(ctx)
}

// GetSystemSettings is the resolver for the getSystemSettings field.
func (r *queryResolver) GetSystemSettings(ctx context.Context) (*model.SystemSettings, error) {
	return services.GetSystemSettings(ctx)
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type (
	mutationResolver struct{ *Resolver }
	queryResolver    struct{ *Resolver }
)
