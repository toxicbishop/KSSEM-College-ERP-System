"use server";

import { getClassroomsByFaculty, getStudentsInClassroom } from "@/services/classroom";
import type { Classroom, ClassroomStudentInfo } from "@/services/classroom";

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchFacultyClassroomsData(
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
export async function fetchStudentsInClassroomData(
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
