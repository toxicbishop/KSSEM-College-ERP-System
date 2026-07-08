package services

import (
	"context"

	"github.com/google/uuid"
	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"github.com/toxicbishop/kssem-college-erp-system/server/firebase"
	"github.com/toxicbishop/kssem-college-erp-system/server/graph/model"
)

func GetClassroomsByFaculty(ctx context.Context, facultyID string) ([]*model.Classroom, error) {
	var classrooms []*model.Classroom
	iter := firebase.Firestore.Collection("classrooms").Where("facultyId", "==", facultyID).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var cls model.Classroom
		if err := doc.DataTo(&cls); err != nil {
			return nil, err
		}
		cls.ID = doc.Ref.ID
		classrooms = append(classrooms, &cls)
	}
	return classrooms, nil
}

func GetStudentsInClassroom(ctx context.Context, classroomID string) ([]*model.ClassroomStudentInfo, error) {
	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var cls model.Classroom
	if err := doc.DataTo(&cls); err != nil {
		return nil, err
	}
	return cls.Students, nil
}

func CreateClassroom(ctx context.Context, input model.ClassroomInput) (*model.Classroom, error) {
	id := uuid.New().String()
	cls := model.Classroom{
		ID:           id,
		Name:         input.Name,
		CourseCode:   input.CourseCode,
		FacultyID:    input.FacultyID,
		FacultyName:  input.FacultyName,
		AcademicYear: input.AcademicYear,
		Semester:     input.Semester,
	}

	_, err := firebase.Firestore.Collection("classrooms").Doc(id).Set(ctx, cls)
	if err != nil {
		return nil, err
	}
	return &cls, nil
}

func AddStudentsToClassroom(ctx context.Context, classroomID string, studentIds []string) (*model.Classroom, error) {
	// Simple implementation
	var students []*model.ClassroomStudentInfo
	for _, id := range studentIds {
		// normally you'd fetch student profile, but for now we just add them
		students = append(students, &model.ClassroomStudentInfo{
			UID: id,
			Name: "Unknown",
			Email: "unknown@example.com",
		})
	}
	
	_, err := firebase.Firestore.Collection("classrooms").Doc(classroomID).Update(ctx, []firestore.Update{
		{
			Path:  "students",
			Value: firestore.ArrayUnion(students),
		},
	})
	if err != nil {
		return nil, err
	}

	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var cls model.Classroom
	doc.DataTo(&cls)
	cls.ID = doc.Ref.ID
	return &cls, nil
}

func RemoveStudentFromClassroom(ctx context.Context, classroomID string, studentID string) (*model.Classroom, error) {
	// Not fully implemented for arrays in firestore without exact object match, 
	// typically you fetch, filter and save
	doc, err := firebase.Firestore.Collection("classrooms").Doc(classroomID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var cls model.Classroom
	if err := doc.DataTo(&cls); err != nil {
		return nil, err
	}
	
	var newStudents []*model.ClassroomStudentInfo
	for _, s := range cls.Students {
		if s.UID != studentID {
			newStudents = append(newStudents, s)
		}
	}
	
	_, err = firebase.Firestore.Collection("classrooms").Doc(classroomID).Update(ctx, []firestore.Update{
		{
			Path:  "students",
			Value: newStudents,
		},
	})
	if err != nil {
		return nil, err
	}

	cls.Students = newStudents
	cls.ID = doc.Ref.ID
	return &cls, nil
}
