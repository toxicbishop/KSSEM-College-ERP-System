package handlers

import (
	"context"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/toxicbishop/kssem-college-erp-system/pkg/logger"
	pb "github.com/toxicbishop/kssem-college-erp-system/proto/academic/v1"
)

type AcademicServer struct {
	pb.UnimplementedAcademicServiceServer
	db  *firestore.Client
	rdb *redis.Client
}

func NewAcademicServer(db *firestore.Client, rdb *redis.Client) *AcademicServer {
	return &AcademicServer{
		db:  db,
		rdb: rdb,
	}
}

// Example Grade Handler (Implementation without relying on generated pb yet)

func (s *AcademicServer) UpdateStudentGrade(ctx context.Context, req *pb.UpdateStudentGradeRequest) (*pb.Grade, error) {
	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)

	grade := &pb.Grade{
		Id:           id,
		StudentId:    req.Grade.StudentId,
		CourseId:     req.Grade.CourseId,
		CourseName:   req.Grade.CourseName,
		Grade:        req.Grade.Grade,
		Score:        req.Grade.Score,
		MaxScore:     req.Grade.MaxScore,
		Semester:     req.Grade.Semester,
		AcademicYear: req.Grade.AcademicYear,
		Timestamp:    timestamp,
	}

	_, err := s.db.Collection("grades").Doc(id).Set(ctx, grade)
	if err != nil {
		logger.Error(ctx, "Failed to save grade", "error", err)
		return nil, err
	}

	// Publish event to Redis Stream for Communication service
	if _, err := s.rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "grades:events",
		Values: map[string]interface{}{
			"action":     "GRADE_PUBLISHED",
			"studentId":  grade.StudentId,
			"courseId":   grade.CourseId,
			"courseName": grade.CourseName,
			"gradeId":    grade.Id,
			"grade":      grade.Grade,
		},
	}).Result(); err != nil {
		logger.Error(ctx, "Failed to publish grade event", "gradeId", grade.Id, "error", err)
		return nil, err
	}

	return grade, nil
}
