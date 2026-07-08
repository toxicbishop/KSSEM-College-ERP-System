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

func GetAttendanceRecords(ctx context.Context, studentID string) ([]*model.AttendanceRecord, error) {
	var records []*model.AttendanceRecord
	iter := firebase.Firestore.Collection("attendance").Where("studentId", "==", studentID).OrderBy("date", firestore.Desc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var rec model.AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			return nil, err
		}
		rec.ID = doc.Ref.ID
		records = append(records, &rec)
	}
	return records, nil
}

func GetLectureAttendanceForDate(ctx context.Context, date string, courseID string) (*model.LectureAttendanceRecord, error) {
	var records []*model.AttendanceRecord
	iter := firebase.Firestore.Collection("attendance").
		Where("date", "==", date).
		Where("courseId", "==", courseID).
		Documents(ctx)
	
	present := int32(0)
	absent := int32(0)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var rec model.AttendanceRecord
		if err := doc.DataTo(&rec); err != nil {
			return nil, err
		}
		rec.ID = doc.Ref.ID
		records = append(records, &rec)

		if rec.Status == "Present" {
			present++
		} else {
			absent++
		}
	}

	return &model.LectureAttendanceRecord{
		LectureID: date + "_" + courseID,
		CourseID: courseID,
		Date: date,
		TotalStudents: present + absent,
		PresentStudents: present,
		AbsentStudents: absent,
		Attendance: records,
	}, nil
}

func SubmitLectureAttendance(ctx context.Context, studentID string, lectureID string, courseID string, date string, status string) (*model.AttendanceRecord, error) {
	id := uuid.New().String()
	timestamp := time.Now().Format(time.RFC3339)

	rec := model.AttendanceRecord{
		ID: id,
		StudentID: studentID,
		LectureID: lectureID,
		CourseID: courseID,
		Date: date,
		Status: status,
		Timestamp: timestamp,
	}

	_, err := firebase.Firestore.Collection("attendance").Doc(id).Set(ctx, rec)
	if err != nil {
		return nil, err
	}
	return &rec, nil
}
