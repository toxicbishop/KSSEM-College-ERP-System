"use server";

import { getAttendanceRecords as getAttendanceRecordsService } from "@/services/attendance";
import { getGradesForStudent as getGradesForStudentService } from "@/services/grades";
import { analyzeGrades } from "@/ai/flows/analyze-grades-flow";
import type { AttendanceRecord } from "@/services/attendance";
import type { Grade } from "@/services/grades";
import type { GradeAnalysisOutput } from "@/services/grades";

/**
 * Server action to fetch attendance records for a student.
 */
export async function fetchAttendanceForStudent(
  idToken: string,
  studentId: string
): Promise<AttendanceRecord[]> {
  try {
    return await getAttendanceRecordsService(idToken, studentId);
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return [];
  }
}

/**
 * Server action to fetch grades for a student.
 */
export async function fetchGradesForStudent(
  idToken: string,
  studentId: string
): Promise<Grade[]> {
  try {
    return await getGradesForStudentService(idToken, studentId);
  } catch (error) {
    console.error("Fetch grades error:", error);
    return [];
  }
}

/**
 * Server action to analyze student grades.
 */
export async function analyzeStudentGradesData(
  grades: Grade[]
): Promise<GradeAnalysisOutput> {
  try {
    return await analyzeGrades(grades);
  } catch (error) {
    console.error("Grade analysis error:", error);
    return {
      overallSummary: "AI analysis is currently unavailable.",
      strengths: [],
      areasForImprovement: [],
    };
  }
}
