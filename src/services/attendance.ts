import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import { z } from "zod";

export const AttendanceAnalysisInputSchema = z.array(
  z.object({
    date: z.string(),
    studentName: z.string(),
    status: z.enum(["present", "absent"]),
  }),
);
export type AttendanceAnalysisInput = z.infer<typeof AttendanceAnalysisInputSchema>;

export const AttendanceAnalysisOutputSchema = z.object({
  overallSummary: z.string(),
  keyObservations: z.array(z.string()),
  actionableSuggestions: z.array(z.string()),
});
export type AttendanceAnalysisOutput = z.infer<typeof AttendanceAnalysisOutputSchema>;

export interface LectureAttendanceRecord {
  id?: string;
  classroomId: string;
  classroomName: string;
  facultyId: string;
  facultyName?: string;
  date: string;
  lectureName: string;
  lectureTopicSlNo?: string;
  lectureDescription?: string;
  studentId: string;
  studentName: string;
  studentIdNumber?: string;
  status: "present" | "absent";
  batch?: string;
  submittedAt?: Date | string;
}

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent";
  lectureName?: string;
  lectureTopicSlNo?: string;
  lectureDescription?: string;
  classroomName?: string;
  facultyName?: string;
}

export async function getAttendanceRecords(
  idToken: string,
  studentId?: string,
): Promise<AttendanceRecord[]> {
  try {
    // If studentId is not provided, the backend will infer it from the auth token
    const url = studentId ? `/api/academic/attendance/${studentId}` : `/api/academic/attendance/me`;
    return await apiGet<AttendanceRecord[]>(url);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    throw error;
  }
}

export async function getLectureAttendanceForDate(
  idToken: string,
  classroomId: string,
  date: string,
): Promise<LectureAttendanceRecord[]> {
  try {
    return await apiGet<LectureAttendanceRecord[]>(`/api/academic/attendance/lecture?classroomId=${classroomId}&date=${date}`);
  } catch (error) {
    console.error("Error fetching lecture attendance:", error);
    throw error;
  }
}

export async function getLectureAttendanceForDateRange(
  idToken: string,
  classroomId: string,
  startDate: string,
  endDate: string,
): Promise<LectureAttendanceRecord[]> {
  try {
    return await apiGet<LectureAttendanceRecord[]>(`/api/academic/attendance/lecture/range?classroomId=${classroomId}&startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    console.error("Error fetching lecture attendance range:", error);
    throw error;
  }
}

export async function submitLectureAttendance(
  records: Omit<LectureAttendanceRecord, "id" | "submittedAt">[],
): Promise<void> {
  if (records.length === 0) return;
  try {
    await apiPost(`/api/academic/attendance/lecture`, { records });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    throw error;
  }
}

export async function deleteLectureAttendance(
  idToken: string,
  classroomId: string,
  date: string,
): Promise<void> {
  try {
    await apiDelete(`/api/academic/attendance/lecture?classroomId=${classroomId}&date=${date}`);
  } catch (error) {
    console.error("Error deleting attendance:", error);
    throw error;
  }
}
