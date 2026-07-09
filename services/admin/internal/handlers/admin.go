package handlers

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/auth"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	academicpb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/admin/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type AdminServer struct {
	pb.UnimplementedAdminServiceServer
	db             *firestore.Client
	authClient     *auth.Client
	academicClient academicpb.AcademicServiceClient
}

func actorUID(ctx context.Context) string {
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if values := md.Get("x-user-id"); len(values) > 0 {
			return values[0]
		}
	}
	return "system"
}

func NewAdminServer(db *firestore.Client, authClient *auth.Client, academicClient academicpb.AcademicServiceClient) *AdminServer {
	return &AdminServer{
		db:             db,
		authClient:     authClient,
		academicClient: academicClient,
	}
}

func (s *AdminServer) GetAllUsers(ctx context.Context, req *emptypb.Empty) (*pb.ListUsersResponse, error) {
	if s.academicClient == nil {
		return nil, status.Errorf(codes.Internal, "Academic client not initialized")
	}

	resp, err := s.academicClient.ListStudentProfiles(ctx, &emptypb.Empty{})
	if err != nil {
		return nil, err
	}

	var users []*pb.UserData
	for _, p := range resp.Profiles {
		users = append(users, &pb.UserData{
			Uid:             p.StudentId,
			Name:            p.Name,
			Email:           p.Email,
			Role:            p.Role,
			ProfilePhotoUrl: p.ProfilePhotoUrl,
			Department:      p.Department,
			DateOfBirth:     p.DateOfBirth,
			ContactNumber:   p.ContactNumber,
		})
	}

	return &pb.ListUsersResponse{Users: users}, nil
}

func (s *AdminServer) writeAuditLog(ctx context.Context, action string, entity string, entityId string, performedBy string, details string) {
	if s.db == nil {
		return
	}
	// Default values if no performedBy (e.g. mock auth)
	if performedBy == "" {
		performedBy = "system"
	}

	logEntry := map[string]interface{}{
		"action":      action,
		"entity":      entity,
		"entityId":    entityId,
		"performedBy": performedBy,
		"details":     details,
		"timestamp":   firestore.ServerTimestamp,
	}

	_, _, err := s.db.Collection("auditLogs").Add(ctx, logEntry)
	if err != nil {
		logger.Error(ctx, "Failed to write audit log", "error", err)
	}
}

func (s *AdminServer) CreateManagedUser(ctx context.Context, req *pb.CreateManagedUserRequest) (*pb.CreateManagedUserResponse, error) {
	if s.authClient == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firebase Auth not initialized")
	}

	// 1. Create Firebase Auth user
	params := (&auth.UserToCreate{}).
		Email(req.Profile.Email).
		Password(req.TemporaryPassword).
		DisplayName(req.Profile.Name)

	u, err := s.authClient.CreateUser(ctx, params)
	if err != nil {
		return nil, err
	}

	uid := u.UID

		// 2. Set custom claims if role is admin
		if req.Profile.Role == "admin" {
			err = s.authClient.SetCustomUserClaims(ctx, uid, map[string]interface{}{"role": "admin"})
			if err != nil {
				logger.Warn(ctx, "Failed to set custom claims for admin, continuing", "uid", uid, "error", err)
			}
		}

		// 3. Create Student Profile via Academic Service
		if s.academicClient != nil {
			academicReq := &academicpb.CreateStudentProfileRequest{
				Uid: uid,
				ProfileData: &academicpb.StudentProfileInput{
					Name:          req.Profile.Name,
					Email:         req.Profile.Email,
					Role:          req.Profile.Role,
					Department:    req.Profile.Department,
					DateOfBirth:   req.Profile.DateOfBirth,
					ContactNumber: req.Profile.ContactNumber,
				},
			}
			_, err = s.academicClient.CreateStudentProfile(ctx, academicReq)
			if err != nil {
				// Attempt to rollback the Firebase Auth user creation.
				// This is a best-effort rollback; if it fails we still
				// return the error so the caller knows the operation
				// was not fully completed.
				logger.Error(ctx, "Academic profile creation failed, attempting rollback", "uid", uid, "error", err)
				if delErr := s.authClient.DeleteUser(ctx, uid); delErr != nil {
					logger.Error(ctx, "Rollback: failed to delete orphaned Auth user", "uid", uid, "error", delErr)
				}
				return nil, status.Errorf(codes.Internal, "failed to create student profile and rolled back auth user: %v", err)
			}
		} else {
			// No academic service available — return an error rather than
			// silently creating an orphaned Auth user with no profile.
			if delErr := s.authClient.DeleteUser(ctx, uid); delErr != nil {
				logger.Error(ctx, "Rollback: failed to delete orphaned Auth user", "uid", uid, "error", delErr)
			}
			return nil, status.Errorf(codes.Unavailable, "academic service is not available; rolled back auth user")
		}

		// 4. Write audit log
		s.writeAuditLog(ctx, "USER_CREATED", "user", uid, actorUID(ctx), "Created user: "+req.Profile.Email)

		return &pb.CreateManagedUserResponse{Uid: uid, AuthUserCreated: true}, nil
}

func (s *AdminServer) UpdateManagedUser(ctx context.Context, req *pb.UpdateManagedUserRequest) (*pb.UpdateManagedUserResponse, error) {
	if s.authClient != nil {
		// Update Firebase Auth user (e.g. Email/Name change)
		params := (&auth.UserToUpdate{}).
			Email(req.Profile.Email).
			DisplayName(req.Profile.Name)
		_, err := s.authClient.UpdateUser(ctx, req.Uid, params)
		if err != nil {
			logger.Error(ctx, "Failed to update Firebase Auth user", "uid", req.Uid, "error", err)
		}

		// Update custom claims if role changed
		if req.Profile.Role == "admin" {
			_ = s.authClient.SetCustomUserClaims(ctx, req.Uid, map[string]interface{}{"role": "admin"})
		} else {
			// Remove admin claim
			_ = s.authClient.SetCustomUserClaims(ctx, req.Uid, map[string]interface{}{})
		}
	}

	// Update via Academic Service
	if s.academicClient != nil {
		academicReq := &academicpb.UpdateStudentProfileRequest{
			Uid: req.Uid,
			ProfileData: &academicpb.StudentProfileInput{
				Name:          req.Profile.Name,
				Email:         req.Profile.Email,
				Role:          req.Profile.Role,
				Department:    req.Profile.Department,
				DateOfBirth:   req.Profile.DateOfBirth,
				ContactNumber: req.Profile.ContactNumber,
			},
		}
		_, err := s.academicClient.UpdateStudentProfile(ctx, academicReq)
		if err != nil {
			return nil, err
		}
	}

	s.writeAuditLog(ctx, "USER_UPDATED", "user", req.Uid, actorUID(ctx), "Updated user: "+req.Profile.Email)

	return &pb.UpdateManagedUserResponse{Profile: req.Profile}, nil
}

func (s *AdminServer) DeleteManagedUser(ctx context.Context, req *pb.DeleteManagedUserRequest) (*emptypb.Empty, error) {
	if s.authClient != nil {
		err := s.authClient.DeleteUser(ctx, req.Uid)
		if err != nil {
			logger.Error(ctx, "Failed to delete Firebase Auth user", "uid", req.Uid, "error", err)
		}
	}

	if s.academicClient != nil {
		_, err := s.academicClient.DeleteStudentProfile(ctx, &academicpb.DeleteStudentProfileRequest{Uid: req.Uid})
		if err != nil {
			return nil, err
		}
	}

	s.writeAuditLog(ctx, "USER_DELETED", "user", req.Uid, actorUID(ctx), "Deleted user")

	return &emptypb.Empty{}, nil
}

func (s *AdminServer) GetAuditLogs(ctx context.Context, req *emptypb.Empty) (*pb.ListAuditLogsResponse, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	iter := s.db.Collection("auditLogs").OrderBy("timestamp", firestore.Desc).Limit(100).Documents(ctx)
	defer iter.Stop()

	var logs []*pb.AuditLog
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		data := doc.Data()

		action, _ := data["action"].(string)
		entity, _ := data["entity"].(string)
		entityId, _ := data["entityId"].(string)
		performedBy, _ := data["performedBy"].(string)
		details, _ := data["details"].(string)

		// Handle timestamp which could be a time.Time from Firestore
		var timestampStr string
		if t, ok := data["timestamp"].(interface{}); ok {
			timestampStr = fmt.Sprintf("%v", t)
		}

		logs = append(logs, &pb.AuditLog{
			Id:          doc.Ref.ID,
			Action:      action,
			Entity:      entity,
			EntityId:    entityId,
			PerformedBy: performedBy,
			Timestamp:   timestampStr,
			Details:     details,
		})
	}

	return &pb.ListAuditLogsResponse{Logs: logs}, nil
}

func (s *AdminServer) GetSystemSettings(ctx context.Context, req *emptypb.Empty) (*pb.SystemSettings, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	doc, err := s.db.Collection("settings").Doc("system").Get(ctx)
	if err != nil {
		// Return default settings if not found
		return &pb.SystemSettings{
			InstitutionName:      "KSSEM",
			AcademicYear:         "2023-2024",
			CurrentSemester:      "Odd",
			Timezone:             "UTC",
			NotificationSettings: &pb.NotificationSettings{},
		}, nil
	}

	var settings pb.SystemSettings
	if err := doc.DataTo(&settings); err != nil {
		return nil, err
	}

	return &settings, nil
}

func (s *AdminServer) UpdateSystemSettings(ctx context.Context, req *pb.UpdateSystemSettingsRequest) (*pb.SystemSettings, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	// Simple map for settings
	settingsMap := map[string]interface{}{
		"institutionName": req.Settings.InstitutionName,
		"academicYear":    req.Settings.AcademicYear,
		"currentSemester": req.Settings.CurrentSemester,
		"maintenanceMode": req.Settings.MaintenanceMode,
		"timezone":        req.Settings.Timezone,
	}

	if req.Settings.NotificationSettings != nil {
		settingsMap["notificationSettings"] = map[string]interface{}{
			"emailNotifications": req.Settings.NotificationSettings.EmailNotifications,
			"smsNotifications":   req.Settings.NotificationSettings.SmsNotifications,
			"examAlerts":         req.Settings.NotificationSettings.ExamAlerts,
			"attendanceAlerts":   req.Settings.NotificationSettings.AttendanceAlerts,
		}
	}

	_, err := s.db.Collection("settings").Doc("system").Set(ctx, settingsMap)
	if err != nil {
		return nil, err
	}

	return req.Settings, nil
}
// ---------------------------------------------------------------------------
// Profile Change Request Handlers — migrated from Next.js server actions
// ---------------------------------------------------------------------------

// List of fields that a student is allowed to request changes for.
// This prevents students from requesting changes to sensitive fields like role.
var allowedProfileFields = map[string]bool{
	"name":             true,
	"email":            true,
	"contactNumber":    true,
	"gender":           true,
	"permanentAddress": true,
	"currentAddress":   true,
	"bloodGroup":       true,
	"emergencyContactName":   true,
	"emergencyContactNumber": true,
	"parentEmail":      true,
}

func (s *AdminServer) CreateProfileChangeRequest(ctx context.Context, req *pb.CreateProfileChangeRequestRequest) (*pb.CreateProfileChangeRequestResponse, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	user, err := auth.GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	// Ensure the user is creating a request for themselves, unless they are an admin
	if user.UID != req.UserId && user.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "cannot create profile change request for another user")
	}

	// Validate the requested field is one a student is allowed to change
	if !allowedProfileFields[req.FieldName] {
		return nil, status.Errorf(codes.InvalidArgument, "field '%s' cannot be changed via a profile change request", req.FieldName)
	}

	// Validate old and new values are not identical
	if req.OldValue == req.NewValue {
		return nil, status.Errorf(codes.InvalidArgument, "old and new values must differ")
	}

	// Validate new value is not empty for required fields
	if req.NewValue == "" && (req.FieldName == "name" || req.FieldName == "email" || req.FieldName == "contactNumber") {
		return nil, status.Errorf(codes.InvalidArgument, "field '%s' cannot be set to empty", req.FieldName)
	}

	// Fetch the user document to get name and email for display
	userDoc, err := s.db.Collection("users").Doc(req.UserId).Get(ctx)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "user not found: %s", req.UserId)
	}
	userData := userDoc.Data()

	userName, _ := userData["name"].(string)
	userEmail, _ := userData["email"].(string)

	// Create the request document
	requestData := map[string]interface{}{
		"userId":      req.UserId,
		"userName":    userName,
		"userEmail":   userEmail,
		"fieldName":   req.FieldName,
		"oldValue":    req.OldValue,
		"newValue":    req.NewValue,
		"requestedAt": firestore.ServerTimestamp,
		"status":      "pending",
	}

	docRef, _, err := s.db.Collection("profileChangeRequests").Add(ctx, requestData)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to create profile change request: %v", err)
	}

	// Write audit log for the creation of a profile change request
	s.writeAuditLog(ctx, "PROFILE_CHANGE_REQUEST_CREATED", "profileChangeRequest", docRef.ID, actor, fmt.Sprintf("User %s requested to change %s", userName, req.FieldName))

	return &pb.CreateProfileChangeRequestResponse{Id: docRef.ID}, nil
}

func (s *AdminServer) GetProfileChangeRequests(ctx context.Context, req *emptypb.Empty) (*pb.ListProfileChangeRequestsResponse, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	user, err := auth.GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	iter := s.db.Collection("profileChangeRequests").OrderBy("requestedAt", firestore.Desc).Documents(ctx)
	defer iter.Stop()

	var requests []*pb.ProfileChangeRequest
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		data := doc.Data()
		reqStatus, _ := data["status"].(string)
		userID, _ := data["userId"].(string)

		// Non-admin users can only see their own requests
		if user.Role != "admin" && userID != user.UID {
			continue
		}

		requestedAtTS := data["requestedAt"]
		requestedAtStr := ""
		if ts, ok := requestedAtTS.(interface{}); ok {
			requestedAtStr = fmt.Sprintf("%v", ts)
		}

		resolvedAtTS := data["resolvedAt"]
		resolvedAtStr := ""
		if ts, ok := resolvedAtTS.(interface{}); ok {
			resolvedAtStr = fmt.Sprintf("%v", ts)
		}

		// Use safe helper to get string from map
		getStr := func(m map[string]interface{}, key string) string {
			if v, ok := m[key].(string); ok {
				return v
			}
			return ""
		}

		requests = append(requests, &pb.ProfileChangeRequest{
			Id:          doc.Ref.ID,
			UserId:      userID,
			UserName:    getStr(data, "userName"),
			UserEmail:   getStr(data, "userEmail"),
			FieldName:   getStr(data, "fieldName"),
			OldValue:    getStr(data, "oldValue"),
			NewValue:    getStr(data, "newValue"),
			RequestedAt: requestedAtStr,
			Status:      reqStatus,
			AdminNotes:  getStr(data, "adminNotes"),
			ResolvedAt:  resolvedAtStr,
		})
	}

	return &pb.ListProfileChangeRequestsResponse{Requests: requests}, nil
}

func (s *AdminServer) ApproveProfileChangeRequest(ctx context.Context, req *pb.ApproveProfileChangeRequestRequest) (*emptypb.Empty, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	user, err := auth.RequireAdmin(ctx)
	if err != nil {
		return nil, err
	}

	if req.RequestId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "request ID is required")
	}

	// Fetch the request document
	requestDoc, err := s.db.Collection("profileChangeRequests").Doc(req.RequestId).Get(ctx)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "profile change request not found: %s", req.RequestId)
	}
	requestData := requestDoc.Data()

	requestStatus, _ := requestData["status"].(string)
	if requestStatus != "pending" {
		return nil, status.Errorf(codes.FailedPrecondition, "request %s is already %s", req.RequestId, requestStatus)
	}

	requestedUserId, _ := requestData["userId"].(string)
	fieldName, _ := requestData["fieldName"].(string)
	newValue, _ := requestData["newValue"].(string)

	// Double check the field is allowed (extra safety)
	if !allowedProfileFields[fieldName] {
		return nil, status.Errorf(codes.InvalidArgument, "field '%s' is not allowed to be changed", fieldName)
	}

	// Use the confirmed new value from the request body (safety check)
	approvedValue := req.NewValue
	if approvedValue == "" {
		approvedValue = newValue
	}

	// Batch update: update the user profile and mark the request as approved
	batch := s.db.Batch()

	userRef := s.db.Collection("users").Doc(requestedUserId)
	batch.Update(userRef, map[string]interface{}{
		fieldName: approvedValue,
	})

	requestRef := s.db.Collection("profileChangeRequests").Doc(req.RequestId)
	batch.Update(requestRef, map[string]interface{}{
		"status":     "approved",
		"resolvedAt": firestore.ServerTimestamp,
		"adminNotes": req.AdminNotes,
	})

	if err := batch.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to approve request: %v", err)
	}

	adminNotes := req.AdminNotes
	if adminNotes == "" {
		adminNotes = fmt.Sprintf("Approved by admin (%s).", user.UID)
	}

	s.writeAuditLog(ctx, "PROFILE_CHANGE_REQUEST_APPROVED", "profileChangeRequest", req.RequestId, user.UID,
		fmt.Sprintf("Approved %s change request for user %s (old: %s, new: %s). Notes: %s",
			fieldName, requestedUserId, requestData["oldValue"], approvedValue, adminNotes))

	return &emptypb.Empty{}, nil
}

func (s *AdminServer) DenyProfileChangeRequest(ctx context.Context, req *pb.DenyProfileChangeRequestRequest) (*emptypb.Empty, error) {
	if s.db == nil {
		return nil, status.Errorf(codes.Unimplemented, "Firestore is not initialized")
	}

	user, err := auth.RequireAdmin(ctx)
	if err != nil {
		return nil, err
	}

	if req.RequestId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "request ID is required")
	}

	if req.AdminNotes == "" {
		return nil, status.Errorf(codes.InvalidArgument, "admin notes are required for denial")
	}

	// Fetch the request document
	requestDoc, err := s.db.Collection("profileChangeRequests").Doc(req.RequestId).Get(ctx)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "profile change request not found: %s", req.RequestId)
	}
	requestData := requestDoc.Data()

	requestStatus, _ := requestData["status"].(string)
	if requestStatus != "pending" {
		return nil, status.Errorf(codes.FailedPrecondition, "request %s is already %s", req.RequestId, requestStatus)
	}

	// Update the request to denied
	_, err = s.db.Collection("profileChangeRequests").Doc(req.RequestId).Update(ctx, map[string]interface{}{
		"status":     "denied",
		"resolvedAt": firestore.ServerTimestamp,
		"adminNotes": req.AdminNotes,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to deny request: %v", err)
	}

	s.writeAuditLog(ctx, "PROFILE_CHANGE_REQUEST_DENIED", "profileChangeRequest", req.RequestId, user.UID,
		fmt.Sprintf("Denied change request: %s. Reason: %s", req.RequestId, req.AdminNotes))

	return &emptypb.Empty{}, nil
}
