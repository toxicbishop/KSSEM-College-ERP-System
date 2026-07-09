"use server";

import {
  getClassroomsByFaculty,
  getStudentsInClassroom,
} from "@/services/classroom";
import {
  submitLectureAttendance,
  getLectureAttendanceForDate,
  getLectureAttendanceForDateRange,
  deleteLectureAttendance,
} from "@/services/attendance";

import type { Classroom, ClassroomStudentInfo } from "@/services/classroom";
import type {
  LectureAttendanceRecord,
  AttendanceAnalysisOutput,
} from "@/services/attendance";

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchClassroomsByFaculty(): Promise<Classroom[]> {
  return await getClassroomsByFaculty();
}

/**
 * Server action to fetch students in a classroom.
 */
export async function fetchStudentsInClassroom(
  classroomId: string
): Promise<ClassroomStudentInfo[]> {
  return await getStudentsInClassroom(classroomId);
}

/**
 * Server action to submit lecture attendance.
 */
export async function submitAttendance(
  records: Omit<LectureAttendanceRecord, "id" | "submittedAt">[]
): Promise<void> {
  try {
    return await submitLectureAttendance(records);
  } catch (error) {
    console.error("Submit attendance error:", error);
    throw error;
  }
}

/**
 * Server action to get lecture attendance for a specific date.
 */
export async function getAttendanceForDate(
  classroomId: string,
  date: string
): Promise<LectureAttendanceRecord[]> {
  return await getLectureAttendanceForDate(classroomId, date);
}

/**
 * Server action to get lecture attendance for a date range.
 */
export async function getAttendanceForDateRange(
  classroomId: string,
  startDate: string,
  endDate: string
): Promise<LectureAttendanceRecord[]> {
  return await getLectureAttendanceForDateRange(
    classroomId,
    startDate,
    endDate
  );
}

/**
 * Server action to delete lecture attendance.
 */
export async function deleteAttendance(
  classroomId: string,
  date: string
): Promise<void> {
  return await deleteLectureAttendance(classroomId, date);
}

/**
 * Server action to analyze attendance using AI.
 */
export async function analyzeAttendanceData(
  records: LectureAttendanceRecord[]
): Promise<AttendanceAnalysisOutput> {
  try {
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api/ai/analyze-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    });
    if (!res.ok) throw new Error('Failed to analyze');
    return await res.json();
  } catch (error) {
    console.error("Attendance analysis error:", error);
    return {
      overallSummary: "AI analysis is currently unavailable.",
      keyObservations: [],
      actionableSuggestions: [],
    };
  }
}
