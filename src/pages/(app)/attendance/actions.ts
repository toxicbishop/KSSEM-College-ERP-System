"use server";

import { getAttendanceRecords as getAttendanceRecordsService } from "@/services/attendance";
import type { AttendanceRecord } from "@/services/attendance";

/**
 * Server action to fetch attendance records.
 */
export async function fetchAttendanceRecords(
  studentId?: string,
): Promise<AttendanceRecord[]> {
  return await getAttendanceRecordsService(studentId);
}
