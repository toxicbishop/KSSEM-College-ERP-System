"use server";

import { getGrades as getGradesService } from "@/services/grades";
import type { Grade } from "@/services/grades";

/**
 * Server action to fetch student grades.
 * This wrapper ensures that firebase-admin dependencies
 * (which require Node.js modules) are only loaded on the server.
 */
export async function fetchGrades(studentId: string): Promise<Grade[]> {
  try {
    return await getGradesService(studentId);
  } catch (error) {
    console.error("Grades fetch error:", error);
    return [];
  }
}
