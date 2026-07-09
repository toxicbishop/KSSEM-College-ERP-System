"use server";

import {
  getStudentsInClassroom,
  removeStudentFromClassroom,
  addStudentsToClassroom,
  searchStudents,
  updateStudentBatchInClassroom,
  getClassroomsByFaculty,
} from "@/services/classroom";
import type { ClassroomStudentInfo, StudentSearchResultItem, Classroom } from "@/services/classroom";

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchFacultyClassroomsForStudent(): Promise<Classroom[]> {
  try {
    return await getClassroomsByFaculty();
  } catch (error) {
    console.error("Fetch classrooms error:", error);
    return [];
  }
}

/**
 * Server action to fetch students in a classroom.
 */
export async function fetchStudentsInClass(
  classroomId: string
): Promise<ClassroomStudentInfo[]> {
  try {
    return await getStudentsInClassroom(classroomId);
  } catch (error) {
    console.error("Fetch students error:", error);
    return [];
  }
}

/**
 * Server action to remove a student from a classroom.
 */
export async function removeStudentFromClass(
  classroomId: string,
  studentId: string
): Promise<void> {
  try {
    return await removeStudentFromClassroom(classroomId, studentId);
  } catch (error) {
    console.error("Remove student error:", error);
    throw error;
  }
}

/**
 * Server action to add students to a classroom.
 */
export async function addStudentsToClass(
  classroomId: string,
  students: any[]
): Promise<void> {
  try {
    return await addStudentsToClassroom(classroomId, students);
  } catch (error) {
    console.error("Add students error:", error);
    throw error;
  }
}

/**
 * Server action to search for students.
 */
export async function searchForStudents(
  classroomId: string,
  searchQuery: string
): Promise<StudentSearchResultItem[]> {
  try {
    return await searchStudents(classroomId, searchQuery);
  } catch (error) {
    console.error("Search students error:", error);
    return [];
  }
}

/**
 * Server action to update student batch in a classroom.
 */
export async function updateStudentBatchForClassroom(
  classroomId: string,
  studentId: string,
  batch: string
): Promise<void> {
  try {
    return await updateStudentBatchInClassroom(classroomId, studentId, batch);
  } catch (error) {
    console.error("Update batch error:", error);
    throw error;
  }
}
