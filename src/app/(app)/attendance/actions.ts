"use server";

import { getAttendanceRecords as getAttendanceRecordsService } from "@/services/attendance";
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
