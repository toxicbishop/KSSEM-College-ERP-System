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
import { analyzeAttendance } from "@/ai/flows/analyze-attendance-flow";
import type { Classroom, ClassroomStudentInfo } from "@/services/classroom";
import type {
  LectureAttendanceRecord,
  AttendanceAnalysisOutput,
} from "@/services/attendance";

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchClassroomsByFaculty(
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
export async function fetchStudentsInClassroom(
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
 * Server action to submit lecture attendance.
 */
export async function submitAttendance(
  idToken: string,
  classroomId: string,
  records: LectureAttendanceRecord[]
): Promise<void> {
  try {
    return await submitLectureAttendance(idToken, classroomId, records);
  } catch (error) {
    console.error("Submit attendance error:", error);
    throw error;
  }
}

/**
 * Server action to get lecture attendance for a specific date.
 */
export async function getAttendanceForDate(
  idToken: string,
  classroomId: string,
  date: string
): Promise<LectureAttendanceRecord[]> {
  try {
    return await getLectureAttendanceForDate(idToken, classroomId, date);
  } catch (error) {
    console.error("Fetch attendance for date error:", error);
    return [];
  }
}

/**
 * Server action to get lecture attendance for a date range.
 */
export async function getAttendanceForDateRange(
  idToken: string,
  classroomId: string,
  startDate: string,
  endDate: string
): Promise<LectureAttendanceRecord[]> {
  try {
    return await getLectureAttendanceForDateRange(
      idToken,
      classroomId,
      startDate,
      endDate
    );
  } catch (error) {
    console.error("Fetch attendance for date range error:", error);
    return [];
  }
}

/**
 * Server action to delete lecture attendance.
 */
export async function deleteAttendance(
  idToken: string,
  docId: string
): Promise<void> {
  try {
    return await deleteLectureAttendance(idToken, docId);
  } catch (error) {
    console.error("Delete attendance error:", error);
    throw error;
  }
}

/**
 * Server action to analyze attendance using AI.
 */
export async function analyzeAttendanceData(
  records: LectureAttendanceRecord[]
): Promise<AttendanceAnalysisOutput> {
  try {
    return await analyzeAttendance(records);
  } catch (error) {
    console.error("Attendance analysis error:", error);
    return {
      overallSummary: "AI analysis is currently unavailable.",
      keyObservations: [],
      actionableSuggestions: [],
    };
  }
}
