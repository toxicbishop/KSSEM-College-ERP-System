"use server";

import { getClassroomsByFaculty, getStudentsInClassroom } from "@/services/classroom";
import type { Classroom, ClassroomStudentInfo } from "@/services/classroom";

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchFacultyClassroomsData(): Promise<Classroom[]> {
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
export async function fetchStudentsInClassroomData(
  classroomId: string
): Promise<ClassroomStudentInfo[]> {
  try {
    return await getStudentsInClassroom(classroomId);
  } catch (error) {
    console.error("Fetch students error:", error);
    return [];
  }
}
