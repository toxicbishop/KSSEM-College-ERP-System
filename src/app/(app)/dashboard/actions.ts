"use server";

import { analyzeGrades } from "@/ai/flows/analyze-grades-flow";
import { getAttendanceRecords as getAttendanceRecordsService } from "@/services/attendance";
import { getGrades as getGradesService } from "@/services/grades";
import type { Grade } from "@/services/grades";
import type { GradeAnalysisOutput } from "@/services/grades";
import type { AttendanceRecord } from "@/services/attendance";

/**
 * Server action to fetch attendance records.
 * This wrapper ensures that firebase-admin dependencies
 * (which require Node.js modules) are only loaded on the server.
 */
export async function fetchAttendanceRecords(
  idToken: string,
  studentId?: string
): Promise<AttendanceRecord[]> {
  try {
    return await getAttendanceRecordsService(idToken, studentId);
  } catch (error) {
    console.error("Attendance records fetch error:", error);
    return [];
  }
}

/**
 * Server action to fetch student grades.
 * This wrapper ensures that firebase-admin dependencies
 * (which require Node.js modules) are only loaded on the server.
 */
export async function fetchStudentGrades(studentId: string): Promise<Grade[]> {
  try {
    return await getGradesService(studentId);
  } catch (error) {
    console.error("Grades fetch error:", error);
    return [];
  }
}

/**
 * Server action to analyze grades using AI.
 * This wrapper ensures that genkit and OpenTelemetry dependencies
 * (which require Node.js modules) are only loaded on the server.
 */
export async function analyzeStudentGrades(
  grades: Grade[]
): Promise<GradeAnalysisOutput> {
  try {
    return await analyzeGrades(grades);
  } catch (error) {
    console.error("Grade analysis server action error:", error);
    // Return a default analysis on error
    return {
      overallSummary:
        "AI analysis is currently unavailable. Please check back later.",
      strengths: [],
      areasForImprovement: [],
    };
  }
}
