import { apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { StudentProfile } from "./profile";

export type ManagedUserProfile = Partial<StudentProfile> & {
  name: string;
  studentId: string;
  email: string;
  parentEmail?: string;
  role: "student" | "faculty" | "admin";
};

export interface UserData extends StudentProfile {
  id: string; // mapped from uid
  createdAt?: any;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const data = await apiPost<{ users: any[] }>(`/api/admin/users/list`, {});
    return (data.users || []).map((u: any) => ({
      ...u,
      id: u.uid,
    }));
  } catch (error) {
    console.error("Failed to fetch all users", error);
    throw error;
  }
}

export async function getAuditLogs(): Promise<any[]> {
  try {
    const data = await apiPost<{ logs: any[] }>(`/api/admin/audit-logs`, {});
    return data.logs || [];
  } catch (error) {
    console.error("Failed to fetch audit logs", error);
    throw error;
  }
}



export async function createManagedUser(
  profile: ManagedUserProfile,
  temporaryPassword: string,
): Promise<{ uid: string; authUserCreated: boolean }> {
  try {
    return await apiPost<{ uid: string; authUserCreated: boolean }>(`/api/admin/users`, {
      profile,
      temporaryPassword,
    });
  } catch (error) {
    console.error("Failed to create managed user", error);
    throw error;
  }
}

export async function updateManagedUser(
  userId: string,
  profile: ManagedUserProfile,
): Promise<void> {
  try {
    await apiPatch(`/api/admin/users/${userId}`, { profile });
  } catch (error) {
    console.error("Failed to update managed user", error);
    throw error;
  }
}

export async function deleteManagedUser(
  userId: string,
): Promise<void> {
  try {
    await apiDelete(`/api/admin/users/${userId}`);
  } catch (error) {
    console.error("Failed to delete managed user", error);
    throw error;
  }
}
