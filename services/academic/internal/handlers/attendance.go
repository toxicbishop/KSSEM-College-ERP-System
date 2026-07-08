package handlers

import (
	"context"
	"time"
	"google.golang.org/grpc/metadata"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
	"google.golang.org/api/iterator"
)

func (s *AcademicServer) GetAttendanceRecords(ctx context.Context, req *pb.GetAttendanceRecordsRequest) (*pb.ListAttendanceResponse, error) {
	var records []*pb.AttendanceRecord
	studentId := req.StudentId
	if studentId == "me" || studentId == "" {
		md, ok := metadata.FromIncomingContext(ctx)
		if ok {
			vals := md.Get("x-user-id")
			if len(vals) > 0 {
				studentId = vals[0]
			}
		}
	}
	iter := s.db.Collection("attendance").Where("studentId", "==", studentId).OrderBy("date", firestore.Desc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var rec pb.AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			return nil, err
		}
		rec.Id = doc.Ref.ID
		records = append(records, &rec)
	}
	return &pb.ListAttendanceResponse{Records: records}, nil
}

func (s *AcademicServer) SubmitLectureAttendance(ctx context.Context, req *pb.SubmitLectureAttendanceRequest) (*pb.AttendanceRecord, error) {
	id := uuid.New().String()
	rec := &pb.AttendanceRecord{
		Id:        id,
		StudentId: req.StudentId,
		LectureId: req.LectureId,
		CourseId:  req.CourseId,
		Date:      req.Date,
		Status:    req.Status,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	_, err := s.db.Collection("attendance").Doc(id).Set(ctx, rec)
	return rec, err
}

func (s *AcademicServer) GetLectureAttendanceForDate(ctx context.Context, req *pb.GetLectureAttendanceForDateRequest) (*pb.LectureAttendanceRecord, error) {
	var records []*pb.AttendanceRecord
	iter := s.db.Collection("attendance").Where("date", "==", req.Date).Where("classroomId", "==", req.ClassroomId).Documents(ctx)

	present, absent := int32(0), int32(0)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		var rec pb.AttendanceRecord
		doc.DataTo(&rec)
		rec.Id = doc.Ref.ID
		records = append(records, &rec)
		if rec.Status == "Present" {
			present++
		} else {
			absent++
		}
	}

	return &pb.LectureAttendanceRecord{
		LectureId:       req.Date + "_" + req.ClassroomId,
		CourseId:        req.ClassroomId,
		Date:            req.Date,
		TotalStudents:   present + absent,
		PresentStudents: present,
		AbsentStudents:  absent,
		Attendance:      records,
	}, nil
}

func (s *AcademicServer) GetLectureAttendanceForDateRange(ctx context.Context, req *pb.GetLectureAttendanceForDateRangeRequest) (*pb.ListLectureAttendanceResponse, error) {
	return &pb.ListLectureAttendanceResponse{}, nil
}
