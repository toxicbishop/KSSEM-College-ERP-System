/**
 * Server actions for classroom data — thin wrappers that call gateway-backed
 * service functions.  These are intentionally kept as server actions because
 * they are invoked from within the authenticated layout (where the user's
 * Firebase JWT is already attached to the api-client Authorization header).
 *
 * NOTE: Errors are re-thrown instead of swallowed so the caller can decide
 * how to handle failures (show a toast, fall back to a cache, etc.).
 */

import {
  getStudentClassroomsWithBatchInfo,
  getClassmatesInfo,
} from "@/services/classroom";
import type {
  StudentClassroomEnrollmentInfo,
  ClassmateInfo,
} from "@/services/classroom";

/**
 * Fetch student classrooms with batch information.
 */
export async function fetchStudentClassrooms(): Promise<StudentClassroomEnrollmentInfo[]> {
  return await getStudentClassroomsWithBatchInfo();
}

/**
 * Fetch classmates information for a given classroom.
 */
export async function fetchClassmates(
  classroomId: string,
): Promise<ClassmateInfo[]> {
  return await getClassmatesInfo(classroomId);
}
