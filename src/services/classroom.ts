import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api-client';
import { createClassroomSchema, formatZodError } from './validation';

export interface ClassroomStudentInfo {
  userId: string;
  studentIdNumber: string;
  name: string;
  email?: string;
  batch?: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  ownerFacultyId: string;
  invitedFacultyIds: string[];
  students: ClassroomStudentInfo[];
  studentUids: string[];
  createdAt?: Date | string;
}

export type ClassroomStudent = ClassroomStudentInfo;

export interface FacultyUser {
  uid: string;
  name: string;
  email: string;
}

export interface StudentSearchResultItem {
  uid: string;
  name: string;
  studentId: string;
  email: string;
}

export interface StudentClassroomEnrollmentInfo {
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  studentBatchInClassroom?: string;
}

export interface ClassmateInfo {
  userId: string;
  name: string;
  studentIdNumber: string;
  batch?: string;
}

export async function createClassroom(
  name: string,
  subject: string,
): Promise<string> {
  // Validate on the client side before hitting the gateway.
  // Note: The schema expects more fields, we'll use a partial or fill defaults
  const validated = createClassroomSchema.partial().safeParse({
    name,
    courseCode: subject,
  });

  if (!validated.success) {
    throw new Error(`Validation failed: ${formatZodError(validated.error)}`);
  }

  const result = await apiPost<{ id: string }>(`/api/academic/classrooms`, {
    classroom: {
      name,
      courseCode: subject,
    }
  });
  return result.id;
}

export async function getClassroomsByFaculty(): Promise<Classroom[]> {
  return await apiGet<Classroom[]>(`/api/academic/classrooms`);
}

export async function getAllFacultyUsers(): Promise<FacultyUser[]> {
  return await apiGet<FacultyUser[]>(`/api/admin/faculty`);
}

export async function getStudentsInClassroom(
  classroomId: string,
): Promise<ClassroomStudentInfo[]> {
  return await apiGet<ClassroomStudentInfo[]>(`/api/academic/classrooms/${classroomId}/students`);
}

export async function addStudentsToClassroom(
  classroomId: string,
  studentsToAdd: StudentSearchResultItem[],
): Promise<void> {
  const studentIds = studentsToAdd.map(s => s.uid);
  await apiPost(`/api/academic/classrooms/${classroomId}/students`, { studentIds });
}

export async function removeStudentFromClassroom(
  classroomId: string,
  studentUserId: string,
): Promise<void> {
  await apiDelete(`/api/academic/classrooms/${classroomId}/students/${studentUserId}`);
}

export async function searchStudents(
  classroomId: string,
  searchTerm: string,
): Promise<StudentSearchResultItem[]> {
  return await apiGet<StudentSearchResultItem[]>(`/api/academic/search/students?q=${encodeURIComponent(searchTerm)}&classroomId=${classroomId}`);
}

export async function addInvitedFacultyToClassroom(
  classroomId: string,
  facultyToInviteId: string,
): Promise<void> {
  await apiPost(`/api/academic/classrooms/${classroomId}/faculty`, { facultyId: facultyToInviteId });
}

export async function deleteClassroom(
  classroomId: string,
): Promise<void> {
  await apiDelete(`/api/academic/classrooms/${classroomId}`);
}

export async function updateStudentBatchInClassroom(
  classroomId: string,
  studentUserId: string,
  newBatch: string,
): Promise<void> {
  await apiPatch(`/api/academic/classrooms/${classroomId}/students/${studentUserId}`, { batch: newBatch });
}

export async function getStudentClassroomsWithBatchInfo(): Promise<StudentClassroomEnrollmentInfo[]> {
  return await apiGet<StudentClassroomEnrollmentInfo[]>(`/api/academic/me/classrooms`);
}

export async function getClassmatesInfo(
  classroomId: string,
): Promise<ClassmateInfo[]> {
  const students = await apiGet<ClassroomStudentInfo[]>(`/api/academic/classrooms/${classroomId}/students`);
  return students.map(s => ({
    userId: s.userId,
    name: s.name,
    studentIdNumber: s.studentIdNumber,
    batch: s.batch
  }));
}
