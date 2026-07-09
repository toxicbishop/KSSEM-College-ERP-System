import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api-client';
import { z } from "zod";

export const GradeAnalysisInputSchema = z.array(
  z.object({
    courseName: z.string(),
    grade: z.string(),
  }),
);
export type GradeAnalysisInput = z.infer<typeof GradeAnalysisInputSchema>;

export const GradeAnalysisOutputSchema = z.object({
  overallSummary: z.string(),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
});
export type GradeAnalysisOutput = z.infer<typeof GradeAnalysisOutputSchema>;

export interface Grade {
  id?: string;
  studentId: string;
  courseName: string;
  grade: string;
  maxMarks?: number;
  facultyId: string;
  updatedAt?: Date | string;
}

export async function getGrades(studentId: string): Promise<Grade[]> {
  try {
    return await apiGet<Grade[]>(`/api/academic/grades/${studentId}`);
  } catch (error) {
    console.error("Error fetching grades:", error);
    throw new Error("Could not fetch grades.");
  }
}

export async function getGradesForStudent(
  studentId: string,
): Promise<Grade[]> {
  return getGrades(studentId);
}

export async function getGradesForClassroom(
  studentUids: string[],
): Promise<Grade[]> {
  // Normally this would be a POST to fetch grades for multiple students
  try {
    return await apiPost<Grade[]>(`/api/academic/grades/classroom`, { studentIds: studentUids });
  } catch (error) {
    console.error("Error fetching grades for classroom:", error);
    throw new Error("Could not fetch classroom grades.");
  }
}

export async function getUniqueCourseNames(): Promise<string[]> {
  try {
    return await apiGet<string[]>(`/api/academic/courses`);
  } catch (error) {
    console.error("Error fetching unique course names:", error);
    throw new Error("Could not fetch course names.");
  }
}

export async function updateStudentGrade(
  gradeInfo: Omit<Grade, "id" | "updatedAt" | "facultyId">,
): Promise<void> {
  try {
    await apiPost(`/api/academic/grades`, gradeInfo);
  } catch (error) {
    console.error("Failed to save grade:", error);
    throw new Error("Failed to save the grade.");
  }
}

export async function deleteStudentGrade(
  gradeId: string,
): Promise<void> {
  try {
    await apiDelete(`/api/academic/grades/${gradeId}`);
  } catch (error) {
    console.error("Failed to delete grade:", error);
    throw new Error("Failed to delete the grade.");
  }
}
