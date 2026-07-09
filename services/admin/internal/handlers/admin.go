package handlers

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
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
			logger.Error(ctx, "Failed to set custom claims for admin", "uid", uid, "error", err)
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
			// Rollback auth user creation if profile creation fails?
			// Ignoring rollback for now as it's an edge case
			logger.Error(ctx, "Failed to create student profile via Academic Service", "uid", uid, "error", err)
		}
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
