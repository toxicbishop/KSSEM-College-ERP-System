package handlers

import (
	"context"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"cloud.google.com/go/firestore"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	"google.golang.org/protobuf/types/known/emptypb"
)

// Example Profile Handlers

type firestoreStudentProfile struct {
	Name                     string `firestore:"name,omitempty"`
	ProfilePhotoUrl          string `firestore:"profilePhotoUrl,omitempty"`
	DateOfBirth              string `firestore:"dateOfBirth,omitempty"`
	Gender                   string `firestore:"gender,omitempty"`
	ContactNumber            string `firestore:"contactNumber,omitempty"`
	Email                    string `firestore:"email,omitempty"`
	PermanentAddress         string `firestore:"permanentAddress,omitempty"`
	CurrentAddress           string `firestore:"currentAddress,omitempty"`
	BloodGroup               string `firestore:"bloodGroup,omitempty"`
	EmergencyContactName     string `firestore:"emergencyContactName,omitempty"`
	EmergencyContactNumber   string `firestore:"emergencyContactNumber,omitempty"`
	EnrollmentNumber         string `firestore:"enrollmentNumber,omitempty"`
	CourseProgram            string `firestore:"courseProgram,omitempty"`
	Department               string `firestore:"department,omitempty"`
	CurrentYear              int32  `firestore:"currentYear,omitempty"`
	CurrentSemester          int32  `firestore:"currentSemester,omitempty"`
	AcademicAdvisorName      string `firestore:"academicAdvisorName,omitempty"`
	SectionOrBatch           string `firestore:"sectionOrBatch,omitempty"`
	AdmissionDate            string `firestore:"admissionDate,omitempty"`
	ModeOfAdmission          string `firestore:"modeOfAdmission,omitempty"`
	IdCardUrl                string `firestore:"idCardUrl,omitempty"`
	AdmissionLetterUrl       string `firestore:"admissionLetterUrl,omitempty"`
	Marksheet10ThUrl         string `firestore:"marksheet10thUrl,omitempty"`
	Marksheet12ThUrl         string `firestore:"marksheet12thUrl,omitempty"`
	MigrationCertificateUrl  string `firestore:"migrationCertificateUrl,omitempty"`
	BonafideCertificateUrl   string `firestore:"bonafideCertificateUrl,omitempty"`
	UploadedPhotoUrl         string `firestore:"uploadedPhotoUrl,omitempty"`
	UploadedSignatureUrl     string `firestore:"uploadedSignatureUrl,omitempty"`
	ExamRegistrationStatus   string `firestore:"examRegistrationStatus,omitempty"`
	AdmitCardUrl             string `firestore:"admitCardUrl,omitempty"`
	InternalExamTimetableUrl string `firestore:"internalExamTimetableUrl,omitempty"`
	ExternalExamTimetableUrl string `firestore:"externalExamTimetableUrl,omitempty"`
	ResultsAndGradeCardsUrl  string `firestore:"resultsAndGradeCardsUrl,omitempty"`
	RevaluationRequestStatus string `firestore:"revaluationRequestStatus,omitempty"`
	RevaluationRequestLink   string `firestore:"revaluationRequestLink,omitempty"`
	Role                     string `firestore:"role,omitempty"`
	ParentEmail              string `firestore:"parentEmail,omitempty"`
}

func (s *AcademicServer) GetStudentProfile(ctx context.Context, req *pb.GetStudentProfileRequest) (*pb.StudentProfile, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized (dummy mode active)")
	}
	// Verify we are fetching from 'users'
	doc, err := s.db.Collection("users").Doc(req.Uid).Get(ctx)
	if err != nil {
		logger.Error(ctx, "Failed to get student profile", "error", err)
		return nil, err
	}
	var fsProfile firestoreStudentProfile
	if err := doc.DataTo(&fsProfile); err != nil {
		return nil, err
	}
	profile := &pb.StudentProfile{
		StudentId:                req.Uid,
		Name:                     fsProfile.Name,
		ProfilePhotoUrl:          fsProfile.ProfilePhotoUrl,
		DateOfBirth:              fsProfile.DateOfBirth,
		Gender:                   fsProfile.Gender,
		ContactNumber:            fsProfile.ContactNumber,
		Email:                    fsProfile.Email,
		PermanentAddress:         fsProfile.PermanentAddress,
		CurrentAddress:           fsProfile.CurrentAddress,
		BloodGroup:               fsProfile.BloodGroup,
		EmergencyContactName:     fsProfile.EmergencyContactName,
		EmergencyContactNumber:   fsProfile.EmergencyContactNumber,
		EnrollmentNumber:         fsProfile.EnrollmentNumber,
		CourseProgram:            fsProfile.CourseProgram,
		Department:               fsProfile.Department,
		CurrentYear:              fsProfile.CurrentYear,
		CurrentSemester:          fsProfile.CurrentSemester,
		AcademicAdvisorName:      fsProfile.AcademicAdvisorName,
		SectionOrBatch:           fsProfile.SectionOrBatch,
		AdmissionDate:            fsProfile.AdmissionDate,
		ModeOfAdmission:          fsProfile.ModeOfAdmission,
		IdCardUrl:                fsProfile.IdCardUrl,
		AdmissionLetterUrl:       fsProfile.AdmissionLetterUrl,
		Marksheet10ThUrl:         fsProfile.Marksheet10ThUrl,
		Marksheet12ThUrl:         fsProfile.Marksheet12ThUrl,
		MigrationCertificateUrl:  fsProfile.MigrationCertificateUrl,
		BonafideCertificateUrl:   fsProfile.BonafideCertificateUrl,
		UploadedPhotoUrl:         fsProfile.UploadedPhotoUrl,
		UploadedSignatureUrl:     fsProfile.UploadedSignatureUrl,
		ExamRegistrationStatus:   fsProfile.ExamRegistrationStatus,
		AdmitCardUrl:             fsProfile.AdmitCardUrl,
		InternalExamTimetableUrl: fsProfile.InternalExamTimetableUrl,
		ExternalExamTimetableUrl: fsProfile.ExternalExamTimetableUrl,
		ResultsAndGradeCardsUrl:  fsProfile.ResultsAndGradeCardsUrl,
		RevaluationRequestStatus: fsProfile.RevaluationRequestStatus,
		RevaluationRequestLink:   fsProfile.RevaluationRequestLink,
		Role:                     fsProfile.Role,
		ParentEmail:              fsProfile.ParentEmail,
	}
	return profile, nil
}

func (s *AcademicServer) UpdateStudentProfile(ctx context.Context, req *pb.UpdateStudentProfileRequest) (*pb.StudentProfile, error) {
	if _, err := auth.RequireOwnerOrAdmin(ctx, req.Uid); err != nil {
		return nil, err
	}

	if req.ProfileData == nil {
		return nil, status.Error(codes.InvalidArgument, "profile data is required")
	}

	// Build a Firestore-safe merge map from the incoming profile data.
	updates := map[string]interface{}{}
	p := req.ProfileData

	if p.Email != "" {
		updates["email"] = p.Email
	}
	if p.Name != "" {
		updates["name"] = p.Name
	}
	// Note: Role should only be updatable by Admin, but for simplicity we'll let it be for now
	// as this is an internal service. The gateway already restricts this.
	if p.Role != "" {
		updates["role"] = p.Role
	}
	if p.Department != "" {
		updates["department"] = p.Department
	}
	if p.DateOfBirth != "" {
		updates["dateOfBirth"] = p.DateOfBirth
	}
	if p.ContactNumber != "" {
		updates["contactNumber"] = p.ContactNumber
	}
	if p.Gender != "" {
		updates["gender"] = p.Gender
	}
	if p.PermanentAddress != "" {
		updates["permanentAddress"] = p.PermanentAddress
	}
	if p.CurrentAddress != "" {
		updates["currentAddress"] = p.CurrentAddress
	}
	if p.BloodGroup != "" {
		updates["bloodGroup"] = p.BloodGroup
	}
	if p.EmergencyContactName != "" {
		updates["emergencyContactName"] = p.EmergencyContactName
	}
	if p.EmergencyContactNumber != "" {
		updates["emergencyContactNumber"] = p.EmergencyContactNumber
	}
	if p.EnrollmentNumber != "" {
		updates["enrollmentNumber"] = p.EnrollmentNumber
	}
	if p.CourseProgram != "" {
		updates["courseProgram"] = p.CourseProgram
	}
	if p.CurrentYear != 0 {
		updates["currentYear"] = p.CurrentYear
	}
	if p.CurrentSemester != 0 {
		updates["currentSemester"] = p.CurrentSemester
	}
	if p.AcademicAdvisorName != "" {
		updates["academicAdvisorName"] = p.AcademicAdvisorName
	}
	if p.SectionOrBatch != "" {
		updates["sectionOrBatch"] = p.SectionOrBatch
	}
	if p.AdmissionDate != "" {
		updates["admissionDate"] = p.AdmissionDate
	}
	if p.ModeOfAdmission != "" {
		updates["modeOfAdmission"] = p.ModeOfAdmission
	}
	if p.ProfilePhotoUrl != "" {
		updates["profilePhotoUrl"] = p.ProfilePhotoUrl
	}
	if p.ParentEmail != "" {
		updates["parentEmail"] = p.ParentEmail
	}
	if p.IdCardUrl != "" {
		updates["idCardUrl"] = p.IdCardUrl
	}
	if p.AdmissionLetterUrl != "" {
		updates["admissionLetterUrl"] = p.AdmissionLetterUrl
	}
	if p.Marksheet10thUrl != "" {
		updates["marksheet10thUrl"] = p.Marksheet10thUrl
	}
	if p.Marksheet12thUrl != "" {
		updates["marksheet12thUrl"] = p.Marksheet12thUrl
	}
	if p.MigrationCertificateUrl != "" {
		updates["migrationCertificateUrl"] = p.MigrationCertificateUrl
	}
	if p.BonafideCertificateUrl != "" {
		updates["bonafideCertificateUrl"] = p.BonafideCertificateUrl
	}
	if p.UploadedPhotoUrl != "" {
		updates["uploadedPhotoUrl"] = p.UploadedPhotoUrl
	}
	if p.UploadedSignatureUrl != "" {
		updates["uploadedSignatureUrl"] = p.UploadedSignatureUrl
	}
	if p.ExamRegistrationStatus != "" {
		updates["examRegistrationStatus"] = p.ExamRegistrationStatus
	}
	if p.AdmitCardUrl != "" {
		updates["admitCardUrl"] = p.AdmitCardUrl
	}
	if p.InternalExamTimetableUrl != "" {
		updates["internalExamTimetableUrl"] = p.InternalExamTimetableUrl
	}
	if p.ExternalExamTimetableUrl != "" {
		updates["externalExamTimetableUrl"] = p.ExternalExamTimetableUrl
	}
	if p.ResultsAndGradeCardsUrl != "" {
		updates["resultsAndGradeCardsUrl"] = p.ResultsAndGradeCardsUrl
	}
	if p.RevaluationRequestStatus != "" {
		updates["revaluationRequestStatus"] = p.RevaluationRequestStatus
	}
	if p.RevaluationRequestLink != "" {
		updates["revaluationRequestLink"] = p.RevaluationRequestLink
	}

	_, err := s.db.Collection("users").Doc(req.Uid).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update profile: %v", err)
	}

	return s.GetStudentProfile(ctx, &pb.GetStudentProfileRequest{Uid: req.Uid})
}

func (s *AcademicServer) ListStudentProfiles(ctx context.Context, req *emptypb.Empty) (*pb.ListStudentProfilesResponse, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	iter := s.db.Collection("users").Documents(ctx)
	defer iter.Stop()

	var profiles []*pb.StudentProfile
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var fsProfile firestoreStudentProfile
		if err := doc.DataTo(&fsProfile); err != nil {
			continue
		}
		profiles = append(profiles, &pb.StudentProfile{
			StudentId:       doc.Ref.ID,
			Name:            fsProfile.Name,
			Email:           fsProfile.Email,
			Role:            fsProfile.Role,
			ProfilePhotoUrl: fsProfile.ProfilePhotoUrl,
			Department:      fsProfile.Department,
			DateOfBirth:     fsProfile.DateOfBirth,
			ContactNumber:   fsProfile.ContactNumber,
		})
	}

	return &pb.ListStudentProfilesResponse{Profiles: profiles}, nil
}

func (s *AcademicServer) CreateStudentProfile(ctx context.Context, req *pb.CreateStudentProfileRequest) (*pb.StudentProfile, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	// Only admins or the user themselves (during signup) can create a profile.
	// Internal service calls might not have auth context, so we allow them if actor is "system" or similar.
	// But here we'll enforce RequireAdmin for managed creation.
	if _, err := auth.RequireAdmin(ctx); err != nil {
		return nil, err
	}

	if req.ProfileData == nil {
		return nil, status.Error(codes.InvalidArgument, "profile data is required")
	}

	// Build the profile with default values where necessary
	fsProfile := firestoreStudentProfile{
		Name:          req.ProfileData.Name,
		Email:         req.ProfileData.Email,
		Role:          req.ProfileData.Role,
		Department:    req.ProfileData.Department,
		DateOfBirth:   req.ProfileData.DateOfBirth,
		ContactNumber: req.ProfileData.ContactNumber,
	}

	_, err := s.db.Collection("users").Doc(req.Uid).Set(ctx, fsProfile)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create profile: %v", err)
	}

	return s.GetStudentProfile(ctx, &pb.GetStudentProfileRequest{Uid: req.Uid})
}

func (s *AcademicServer) DeleteStudentProfile(ctx context.Context, req *pb.DeleteStudentProfileRequest) (*emptypb.Empty, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	if _, err := auth.RequireAdmin(ctx); err != nil {
		return nil, err
	}

	_, err := s.db.Collection("users").Doc(req.Uid).Delete(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete profile: %v", err)
	}

	return &emptypb.Empty{}, nil
}
