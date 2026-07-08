package handlers

import (
	"context"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"cloud.google.com/go/firestore"
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
	updates := map[string]interface{}{}
	// Normally we would reflect over the fields of req.ProfileData or check for non-zero values
	if req.ProfileData.Email != "" {
		updates["email"] = req.ProfileData.Email
	}
	if req.ProfileData.Name != "" {
		updates["name"] = req.ProfileData.Name
	}
	// ... add the rest of the fields here

	_, err := s.db.Collection("users").Doc(req.Uid).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		return nil, err
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
		return nil, err
	}

	return s.GetStudentProfile(ctx, &pb.GetStudentProfileRequest{Uid: req.Uid})
}

func (s *AcademicServer) DeleteStudentProfile(ctx context.Context, req *pb.DeleteStudentProfileRequest) (*emptypb.Empty, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	_, err := s.db.Collection("users").Doc(req.Uid).Delete(ctx)
	if err != nil {
		return nil, err
	}

	return &emptypb.Empty{}, nil
}
