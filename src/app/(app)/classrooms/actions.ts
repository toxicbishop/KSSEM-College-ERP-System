"use server";

import {
  getStudentClassroomsWithBatchInfo,
  getClassmatesInfo,
} from "@/services/classroom";
import type {
  StudentClassroomEnrollmentInfo,
  ClassmateInfo,
} from "@/services/classroom";

/**
 * Server action to fetch student classrooms with batch information.
 */
export async function fetchStudentClassrooms(
  idToken: string
): Promise<StudentClassroomEnrollmentInfo[]> {
  try {
    return await getStudentClassroomsWithBatchInfo(idToken);
  } catch (error) {
    console.error("Fetch student classrooms error:", error);
    return [];
  }
}

/**
 * Server action to fetch classmates information.
 */
export async function fetchClassmates(
  idToken: string,
  classroomId: string
): Promise<ClassmateInfo[]> {
  try {
    return await getClassmatesInfo(idToken, classroomId);
  } catch (error) {
    console.error("Fetch classmates error:", error);
    return [];
  }
}
