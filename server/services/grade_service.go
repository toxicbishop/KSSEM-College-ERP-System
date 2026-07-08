package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetGrades(ctx context.Context, studentID string) ([]*model.Grade, error) {
	var grades []*model.Grade
	iter := firebase.Firestore.Collection("grades").Where("studentId", "==", studentID).OrderBy("timestamp", firestore.Desc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var grade model.Grade
		if err := doc.DataTo(&grade); err != nil {
			return nil, err
		}
		grade.ID = doc.Ref.ID
		grades = append(grades, &grade)
	}
	return grades, nil
}

func GetGradesForClassroom(ctx context.Context, classroomID string, courseName string) ([]*model.Grade, error) {
	var grades []*model.Grade
	iter := firebase.Firestore.Collection("grades").Where("courseName", "==", courseName).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var grade model.Grade
		if err := doc.DataTo(&grade); err != nil {
			return nil, err
		}
		grade.ID = doc.Ref.ID
		grades = append(grades, &grade)
	}
	return grades, nil
}

func UpdateStudentGrade(ctx context.Context, input model.GradeInput) (*model.Grade, error) {
	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)

	grade := model.Grade{
		ID:           id,
		StudentID:    input.StudentID,
		CourseID:     input.CourseID,
		CourseName:   input.CourseName,
		Grade:        input.Grade,
		Score:        input.Score,
		MaxScore:     input.MaxScore,
		Semester:     input.Semester,
		AcademicYear: input.AcademicYear,
		Timestamp:    timestamp,
	}

	_, err := firebase.Firestore.Collection("grades").Doc(id).Set(ctx, grade)
	if err != nil {
		return nil, err
	}
	return &grade, nil
}

func DeleteStudentGrade(ctx context.Context, id string) (*bool, error) {
	_, err := firebase.Firestore.Collection("grades").Doc(id).Delete(ctx)
	success := err == nil
	return &success, err
}
