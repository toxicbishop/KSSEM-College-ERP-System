"use server";

import {
  createClassroom,
  getClassroomsByFaculty,
  addInvitedFacultyToClassroom,
  getAllFacultyUsers,
  deleteClassroom,
} from "@/services/classroom";
import type { Classroom, FacultyUser } from "@/services/classroom";

/**
 * Server action to create a new classroom.
 */
export async function createNewClassroom(
  name: string,
  subject: string
): Promise<string> {
  try {
    return await createClassroom(name, subject);
  } catch (error) {
    console.error("Create classroom error:", error);
    throw error;
  }
}

/**
 * Server action to fetch classrooms for a faculty member.
 */
export async function fetchFacultyClassroomsList(): Promise<Classroom[]> {
  try {
    return await getClassroomsByFaculty();
  } catch (error) {
    console.error("Fetch classrooms error:", error);
    return [];
  }
}

/**
 * Server action to add invited faculty to a classroom.
 */
export async function addFacultyToClassroom(
  classroomId: string,
  facultyId: string
): Promise<void> {
  try {
    return await addInvitedFacultyToClassroom(classroomId, facultyId);
  } catch (error) {
    console.error("Add faculty error:", error);
    throw error;
  }
}

/**
 * Server action to get all faculty users.
 */
export async function getAllFacultyUsersList(): Promise<FacultyUser[]> {
  try {
    return await getAllFacultyUsers();
  } catch (error) {
    console.error("Get faculty users error:", error);
    return [];
  }
}

/**
 * Server action to delete a classroom.
 */
export async function deleteClassroomRecord(
  classroomId: string
): Promise<void> {
  try {
    return await deleteClassroom(classroomId);
  } catch (error) {
    console.error("Delete classroom error:", error);
    throw error;
  }
}
