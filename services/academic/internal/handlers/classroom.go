package handlers

import (
	"context"
	"google.golang.org/grpc/metadata"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	"google.golang.org/api/iterator"
)

func (s *AcademicServer) GetClassroomsByFaculty(ctx context.Context, req *pb.GetClassroomsByFacultyRequest) (*pb.ListClassroomsResponse, error) {
	var classrooms []*pb.Classroom
	facultyId := req.FacultyId
	if facultyId == "me" || facultyId == "" {
		md, ok := metadata.FromIncomingContext(ctx)
		if ok {
			vals := md.Get("x-user-id")
			if len(vals) > 0 {
				facultyId = vals[0]
			}
		}
	}
	iter := s.db.Collection("classrooms").Where("facultyId", "==", facultyId).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var cls pb.Classroom
		if err := doc.DataTo(&cls); err != nil {
			return nil, err
		}
		cls.Id = doc.Ref.ID
		classrooms = append(classrooms, &cls)
	}
	return &pb.ListClassroomsResponse{Classrooms: classrooms}, nil
}

func (s *AcademicServer) CreateClassroom(ctx context.Context, req *pb.CreateClassroomRequest) (*pb.Classroom, error) {
	id := uuid.New().String()
	cls := &pb.Classroom{
		Id:           id,
		Name:         req.Classroom.Name,
		CourseCode:   req.Classroom.CourseCode,
		FacultyId:    req.Classroom.FacultyId,
		FacultyName:  req.Classroom.FacultyName,
		AcademicYear: req.Classroom.AcademicYear,
		Semester:     req.Classroom.Semester,
	}

	_, err := s.db.Collection("classrooms").Doc(id).Set(ctx, cls)
	return cls, err
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
	var students []*pb.ClassroomStudentInfo
	for _, id := range req.StudentIds {
		students = append(students, &pb.ClassroomStudentInfo{
			Uid: id, Name: "Unknown", Email: "unknown@example.com",
		})
	}

	_, err := s.db.Collection("classrooms").Doc(req.ClassroomId).Update(ctx, []firestore.Update{
		{Path: "students", Value: firestore.ArrayUnion(students)},
	})
	if err != nil {
		return nil, err
	}

	doc, _ := s.db.Collection("classrooms").Doc(req.ClassroomId).Get(ctx)
	var cls pb.Classroom
	doc.DataTo(&cls)
	cls.Id = doc.Ref.ID
	return &cls, nil
}

func (s *AcademicServer) RemoveStudentFromClassroom(ctx context.Context, req *pb.RemoveStudentFromClassroomRequest) (*pb.Classroom, error) {
	// Need to fetch current list and filter it, as exact object match is required for ArrayRemove
	doc, err := s.db.Collection("classrooms").Doc(req.ClassroomId).Get(ctx)
	if err != nil {
		return nil, err
	}

	var cls pb.Classroom
	doc.DataTo(&cls)

	var newStudents []*pb.ClassroomStudentInfo
	for _, st := range cls.Students {
		if st.Uid != req.StudentId {
			newStudents = append(newStudents, st)
		}
	}

	_, err = s.db.Collection("classrooms").Doc(req.ClassroomId).Update(ctx, []firestore.Update{
		{Path: "students", Value: newStudents},
	})

	cls.Students = newStudents
	cls.Id = doc.Ref.ID
	return &cls, err
}
