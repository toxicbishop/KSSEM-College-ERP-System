package handlers

import (
	"context"
	"google.golang.org/grpc/metadata"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/auth"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *AcademicServer) GetClassroomsByFaculty(ctx context.Context, req *pb.GetClassroomsByFacultyRequest) (*pb.ListClassroomsResponse, error) {
	user, err := auth.GetUserContext(ctx)
	if err != nil {
		return nil, err
	}

	facultyID := req.FacultyId
	if facultyID == "me" || facultyID == "" {
		facultyID = user.UID
	}

	// Ensure the user is requesting their own classrooms or is an admin
	if user.UID != facultyID && user.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "cannot list classrooms for another faculty")
	}

	var classrooms []*pb.Classroom
	iter := s.db.Collection("classrooms").Where("facultyId", "==", facultyID).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to fetch classrooms: %v", err)
		}
		var cls pb.Classroom
		if err := doc.DataTo(&cls); err != nil {
			continue
		}
		cls.Id = doc.Ref.ID
		classrooms = append(classrooms, &cls)
	}
	return &pb.ListClassroomsResponse{Classrooms: classrooms}, nil
}

func (s *AcademicServer) CreateClassroom(ctx context.Context, req *pb.CreateClassroomRequest) (*pb.Classroom, error) {
	user, err := auth.RequireRole(ctx, "faculty")
	if err != nil {
		return nil, err
	}

	if req.Classroom == nil {
		return nil, status.Error(codes.InvalidArgument, "classroom data is required")
	}

	id := uuid.New().String()
	cls := &pb.Classroom{
		Id:           id,
		Name:         req.Classroom.Name,
		CourseCode:   req.Classroom.CourseCode,
		FacultyId:    user.UID, // Force faculty ID to the authenticated user
		FacultyName:  req.Classroom.FacultyName,
		AcademicYear: req.Classroom.AcademicYear,
		Semester:     req.Classroom.Semester,
	}

	_, err = s.db.Collection("classrooms").Doc(id).Set(ctx, cls)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create classroom: %v", err)
	}
	return cls, nil
}

func (s *AcademicServer) GetStudentsInClassroom(ctx context.Context, req *pb.GetStudentsInClassroomRequest) (*pb.ListStudentsResponse, error) {
	doc, err := s.db.Collection("classrooms").Doc(req.ClassroomId).Get(ctx)
	if err != nil {
		return nil, err
	}
	var cls pb.Classroom
	if err := doc.DataTo(&cls); err != nil {
		return nil, err
	}
	return &pb.ListStudentsResponse{Students: cls.Students}, nil
}

func (s *AcademicServer) AddStudentsToClassroom(ctx context.Context, req *pb.AddStudentsToClassroomRequest) (*pb.Classroom, error) {
	doc, err := s.db.Collection("classrooms").Doc(req.ClassroomId).Get(ctx)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "classroom not found: %s", req.ClassroomId)
	}

	data := doc.Data()
	ownerID, _ := data["facultyId"].(string)
	if _, err := auth.RequireOwnerOrAdmin(ctx, ownerID); err != nil {
		return nil, err
	}

	var students []*pb.ClassroomStudentInfo
	var studentUIDs []string
	for _, id := range req.StudentIds {
		// Fetch actual student data instead of using "Unknown"
		studentDoc, err := s.db.Collection("users").Doc(id).Get(ctx)
		if err != nil {
			continue // Skip invalid student IDs
		}
		studentData := studentDoc.Data()
		students = append(students, &pb.ClassroomStudentInfo{
			Uid:              id,
			Name:             studentData["name"].(string),
			Email:            studentData["email"].(string),
			EnrollmentNumber: studentData["enrollmentNumber"].(string),
			SectionOrBatch:   studentData["sectionOrBatch"].(string),
		})
		studentUIDs = append(studentUIDs, id)
	}

	_, err = s.db.Collection("classrooms").Doc(req.ClassroomId).Update(ctx, []firestore.Update{
		{Path: "students", Value: firestore.ArrayUnion(students)},
		{Path: "studentUids", Value: firestore.ArrayUnion(studentUIDs)},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to add students: %v", err)
	}

	// Fetch updated classroom
	updatedDoc, _ := s.db.Collection("classrooms").Doc(req.ClassroomId).Get(ctx)
	var cls pb.Classroom
	updatedDoc.DataTo(&cls)
	cls.Id = updatedDoc.Ref.ID
	return &cls, nil
}

func (s *AcademicServer) RemoveStudentFromClassroom(ctx context.Context, req *pb.RemoveStudentFromClassroomRequest) (*pb.Classroom, error) {
	doc, err := s.db.Collection("classrooms").Doc(req.ClassroomId).Get(ctx)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "classroom not found: %s", req.ClassroomId)
	}

	data := doc.Data()
	ownerID, _ := data["facultyId"].(string)
	if _, err := auth.RequireOwnerOrAdmin(ctx, ownerID); err != nil {
		return nil, err
	}

	var cls pb.Classroom
	doc.DataTo(&cls)

	var newStudents []*pb.ClassroomStudentInfo
	var newStudentUIDs []string
	for _, st := range cls.Students {
		if st.Uid != req.StudentId {
			newStudents = append(newStudents, st)
			newStudentUIDs = append(newStudentUIDs, st.Uid)
		}
	}

	_, err = s.db.Collection("classrooms").Doc(req.ClassroomId).Update(ctx, []firestore.Update{
		{Path: "students", Value: newStudents},
		{Path: "studentUids", Value: newStudentUIDs},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to remove student: %v", err)
	}

	cls.Students = newStudents
	cls.Id = doc.Ref.ID
	return &cls, nil
}
