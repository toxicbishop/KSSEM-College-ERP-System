"use server";

import { getAttendanceRecords as getAttendanceRecordsService } from "@/services/attendance";
import { getGradesForStudent as getGradesForStudentService } from "@/services/grades";

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
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api/ai/analyze-grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grades }),
    });
    if (!res.ok) throw new Error('Failed to analyze');
    return await res.json();
  } catch (error) {
    console.error("Grade analysis error:", error);
    return {
      overallSummary: "AI analysis is currently unavailable.",
      strengths: [],
      areasForImprovement: [],
    };
  }
}
