package academic

import (
	"encoding/json"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/pkg/logger"
)

type StudentProfile struct {
	StudentId                string `json:"studentId"`
	Name                     string `json:"name,omitempty" firestore:"name,omitempty"`
	ProfilePhotoUrl          string `json:"profilePhotoUrl,omitempty" firestore:"profilePhotoUrl,omitempty"`
	DateOfBirth              string `json:"dateOfBirth,omitempty" firestore:"dateOfBirth,omitempty"`
	Gender                   string `json:"gender,omitempty" firestore:"gender,omitempty"`
	ContactNumber            string `json:"contactNumber,omitempty" firestore:"contactNumber,omitempty"`
	Email                    string `json:"email,omitempty" firestore:"email,omitempty"`
	PermanentAddress         string `json:"permanentAddress,omitempty" firestore:"permanentAddress,omitempty"`
	CurrentAddress           string `json:"currentAddress,omitempty" firestore:"currentAddress,omitempty"`
	BloodGroup               string `json:"bloodGroup,omitempty" firestore:"bloodGroup,omitempty"`
	EmergencyContactName     string `json:"emergencyContactName,omitempty" firestore:"emergencyContactName,omitempty"`
	EmergencyContactNumber   string `json:"emergencyContactNumber,omitempty" firestore:"emergencyContactNumber,omitempty"`
	EnrollmentNumber         string `json:"enrollmentNumber,omitempty" firestore:"enrollmentNumber,omitempty"`
	CourseProgram            string `json:"courseProgram,omitempty" firestore:"courseProgram,omitempty"`
	Department               string `json:"department,omitempty" firestore:"department,omitempty"`
	CurrentYear              int32  `json:"currentYear,omitempty" firestore:"currentYear,omitempty"`
	CurrentSemester          int32  `json:"currentSemester,omitempty" firestore:"currentSemester,omitempty"`
	AcademicAdvisorName      string `json:"academicAdvisorName,omitempty" firestore:"academicAdvisorName,omitempty"`
	SectionOrBatch           string `json:"sectionOrBatch,omitempty" firestore:"sectionOrBatch,omitempty"`
	AdmissionDate            string `json:"admissionDate,omitempty" firestore:"admissionDate,omitempty"`
	ModeOfAdmission          string `json:"modeOfAdmission,omitempty" firestore:"modeOfAdmission,omitempty"`
	IdCardUrl                string `json:"idCardUrl,omitempty" firestore:"idCardUrl,omitempty"`
	AdmissionLetterUrl       string `json:"admissionLetterUrl,omitempty" firestore:"admissionLetterUrl,omitempty"`
	Marksheet10thUrl         string `json:"marksheet10thUrl,omitempty" firestore:"marksheet10thUrl,omitempty"`
	Marksheet12thUrl         string `json:"marksheet12thUrl,omitempty" firestore:"marksheet12thUrl,omitempty"`
	MigrationCertificateUrl  string `json:"migrationCertificateUrl,omitempty" firestore:"migrationCertificateUrl,omitempty"`
	BonafideCertificateUrl   string `json:"bonafideCertificateUrl,omitempty" firestore:"bonafideCertificateUrl,omitempty"`
	UploadedPhotoUrl         string `json:"uploadedPhotoUrl,omitempty" firestore:"uploadedPhotoUrl,omitempty"`
	UploadedSignatureUrl     string `json:"uploadedSignatureUrl,omitempty" firestore:"uploadedSignatureUrl,omitempty"`
	ExamRegistrationStatus   string `json:"examRegistrationStatus,omitempty" firestore:"examRegistrationStatus,omitempty"`
	AdmitCardUrl             string `json:"admitCardUrl,omitempty" firestore:"admitCardUrl,omitempty"`
	InternalExamTimetableUrl string `json:"internalExamTimetableUrl,omitempty" firestore:"internalExamTimetableUrl,omitempty"`
	ExternalExamTimetableUrl string `json:"externalExamTimetableUrl,omitempty" firestore:"externalExamTimetableUrl,omitempty"`
	ResultsAndGradeCardsUrl  string `json:"resultsAndGradeCardsUrl,omitempty" firestore:"resultsAndGradeCardsUrl,omitempty"`
	RevaluationRequestStatus string `json:"revaluationRequestStatus,omitempty" firestore:"revaluationRequestStatus,omitempty"`
	RevaluationRequestLink   string `json:"revaluationRequestLink,omitempty" firestore:"revaluationRequestLink,omitempty"`
	Role                     string `json:"role,omitempty" firestore:"role,omitempty"`
	ParentEmail              string `json:"parentEmail,omitempty" firestore:"parentEmail,omitempty"`
}

func GetStudentProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := chi.URLParam(r, "uid")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	doc, err := firebase.Firestore.Collection("users").Doc(uid).Get(ctx)
	if err != nil {
		logger.Error(ctx, "Failed to get student profile", "error", err)
		WriteError(w, http.StatusNotFound, "Profile not found")
		return
	}

	var profile StudentProfile
	if err := doc.DataTo(&profile); err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to parse profile")
		return
	}
	profile.StudentId = uid
	WriteJSON(w, http.StatusOK, profile)
}

func UpdateStudentProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := chi.URLParam(r, "uid")

	if _, err := auth.RequireOwnerOrAdmin(ctx, uid); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var reqData struct {
		ProfileData StudentProfile `json:"profileData"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	updates := map[string]interface{}{}
	p := reqData.ProfileData

	// Direct assignment mappings to omit empty string updates
	if p.Email != "" { updates["email"] = p.Email }
	if p.Name != "" { updates["name"] = p.Name }
	if p.Role != "" { updates["role"] = p.Role }
	if p.Department != "" { updates["department"] = p.Department }
	if p.DateOfBirth != "" { updates["dateOfBirth"] = p.DateOfBirth }
	if p.ContactNumber != "" { updates["contactNumber"] = p.ContactNumber }
	if p.Gender != "" { updates["gender"] = p.Gender }
	if p.PermanentAddress != "" { updates["permanentAddress"] = p.PermanentAddress }
	if p.CurrentAddress != "" { updates["currentAddress"] = p.CurrentAddress }
	if p.BloodGroup != "" { updates["bloodGroup"] = p.BloodGroup }
	if p.EmergencyContactName != "" { updates["emergencyContactName"] = p.EmergencyContactName }
	if p.EmergencyContactNumber != "" { updates["emergencyContactNumber"] = p.EmergencyContactNumber }
	if p.EnrollmentNumber != "" { updates["enrollmentNumber"] = p.EnrollmentNumber }
	if p.CourseProgram != "" { updates["courseProgram"] = p.CourseProgram }
	if p.CurrentYear != 0 { updates["currentYear"] = p.CurrentYear }
	if p.CurrentSemester != 0 { updates["currentSemester"] = p.CurrentSemester }
	if p.AcademicAdvisorName != "" { updates["academicAdvisorName"] = p.AcademicAdvisorName }
	if p.SectionOrBatch != "" { updates["sectionOrBatch"] = p.SectionOrBatch }
	if p.AdmissionDate != "" { updates["admissionDate"] = p.AdmissionDate }
	if p.ModeOfAdmission != "" { updates["modeOfAdmission"] = p.ModeOfAdmission }
	if p.ProfilePhotoUrl != "" { updates["profilePhotoUrl"] = p.ProfilePhotoUrl }
	if p.ParentEmail != "" { updates["parentEmail"] = p.ParentEmail }
	if p.IdCardUrl != "" { updates["idCardUrl"] = p.IdCardUrl }
	if p.AdmissionLetterUrl != "" { updates["admissionLetterUrl"] = p.AdmissionLetterUrl }
	if p.Marksheet10thUrl != "" { updates["marksheet10thUrl"] = p.Marksheet10thUrl }
	if p.Marksheet12thUrl != "" { updates["marksheet12thUrl"] = p.Marksheet12thUrl }
	if p.MigrationCertificateUrl != "" { updates["migrationCertificateUrl"] = p.MigrationCertificateUrl }
	if p.BonafideCertificateUrl != "" { updates["bonafideCertificateUrl"] = p.BonafideCertificateUrl }
	if p.UploadedPhotoUrl != "" { updates["uploadedPhotoUrl"] = p.UploadedPhotoUrl }
	if p.UploadedSignatureUrl != "" { updates["uploadedSignatureUrl"] = p.UploadedSignatureUrl }
	if p.ExamRegistrationStatus != "" { updates["examRegistrationStatus"] = p.ExamRegistrationStatus }
	if p.AdmitCardUrl != "" { updates["admitCardUrl"] = p.AdmitCardUrl }
	if p.InternalExamTimetableUrl != "" { updates["internalExamTimetableUrl"] = p.InternalExamTimetableUrl }
	if p.ExternalExamTimetableUrl != "" { updates["externalExamTimetableUrl"] = p.ExternalExamTimetableUrl }
	if p.ResultsAndGradeCardsUrl != "" { updates["resultsAndGradeCardsUrl"] = p.ResultsAndGradeCardsUrl }
	if p.RevaluationRequestStatus != "" { updates["revaluationRequestStatus"] = p.RevaluationRequestStatus }
	if p.RevaluationRequestLink != "" { updates["revaluationRequestLink"] = p.RevaluationRequestLink }

	_, err := firebase.Firestore.Collection("users").Doc(uid).Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Fetch updated profile
	GetStudentProfile(w, r)
}

func ListStudentProfiles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	iter := firebase.Firestore.Collection("users").Documents(ctx)
	defer iter.Stop()

	var profiles []StudentProfile
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var profile StudentProfile
		if err := doc.DataTo(&profile); err != nil {
			continue
		}
		profile.StudentId = doc.Ref.ID
		profiles = append(profiles, profile)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"profiles": profiles,
	})
}

func CreateStudentProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := chi.URLParam(r, "uid")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	if _, err := auth.RequireAdmin(ctx); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	var reqData struct {
		ProfileData StudentProfile `json:"profileData"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	_, err := firebase.Firestore.Collection("users").Doc(uid).Set(ctx, reqData.ProfileData)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create profile")
		return
	}

	GetStudentProfile(w, r)
}

func DeleteStudentProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := chi.URLParam(r, "uid")

	if firebase.Firestore == nil {
		WriteError(w, http.StatusNotImplemented, "Firestore is not initialized")
		return
	}

	if _, err := auth.RequireAdmin(ctx); err != nil {
		WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	_, err := firebase.Firestore.Collection("users").Doc(uid).Delete(ctx)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete profile")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{})
}
