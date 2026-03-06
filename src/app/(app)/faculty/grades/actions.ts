"use server";

import { getClassroomsByFaculty, getStudentsInClassroom } from "@/services/classroom";
import {
  getGrades,
  updateStudentGrade,
  getUniqueCourseNames,
  deleteStudentGrade,
  getGradesForClassroom,
} from "@/services/grades";
import type { Classroom, ClassroomStudentInfo } from "@/services/classroom";
import type { Grade } from "@/services/grades";

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchFacultyClassrooms(
  idToken: string
): Promise<Classroom[]> {
  try {
    return await getClassroomsByFaculty(idToken);
  } catch (error) {
    console.error("Fetch classrooms error:", error);
    return [];
  }
}

/**
 * Server action to fetch students in a classroom.
 */
export async function fetchStudentsForClassroom(
  idToken: string,
  classroomId: string
): Promise<ClassroomStudentInfo[]> {
  try {
    return await getStudentsInClassroom(idToken, classroomId);
  } catch (error) {
    console.error("Fetch students error:", error);
    return [];
  }
}

/**
 * Server action to fetch grades for a student.
 */
export async function fetchStudentGradesForFaculty(
  studentId: string
): Promise<Grade[]> {
  try {
    return await getGrades(studentId);
  } catch (error) {
    console.error("Fetch student grades error:", error);
    return [];
  }
}

/**
 * Server action to get unique course names.
 */
export async function getUniqueCoursesForFaculty(
  idToken: string
): Promise<string[]> {
  try {
    return await getUniqueCourseNames(idToken);
  } catch (error) {
    console.error("Fetch unique courses error:", error);
    return [];
  }
}

/**
 * Server action to update a student's grade.
 */
export async function updateGradeForStudent(
  idToken: string,
  gradeData: { studentId: string; courseName: string; grade: string; maxMarks?: number }
): Promise<void> {
  try {
    return await updateStudentGrade(idToken, gradeData);
  } catch (error) {
    console.error("Update grade error:", error);
    throw error;
  }
}

/**
 * Server action to delete a student's grade.
 */
export async function deleteGradeRecord(
  idToken: string,
  gradeId: string
): Promise<void> {
  try {
    return await deleteStudentGrade(idToken, gradeId);
  } catch (error) {
    console.error("Delete grade error:", error);
    throw error;
  }
}

/**
 * Server action to get grades for a classroom.
 */
export async function fetchGradesForClassroom(
  idToken: string,
  studentUids: string[]
): Promise<Grade[]> {
  try {
    return await getGradesForClassroom(idToken, studentUids);
  } catch (error) {
    console.error("Fetch classroom grades error:", error);
    return [];
  }
}
