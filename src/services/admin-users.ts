"use server";

import {
  adminAuth,
  adminDb,
  adminInitializationError,
} from "@/lib/firebase/admin.server";
import { FieldValue as AdminFieldValue } from "firebase-admin/firestore";
import type { StudentProfile } from "./profile";
import { writeAuditLog, type AuditAction } from "./audit-logs";

export type ManagedUserProfile = Partial<StudentProfile> & {
  name: string;
  studentId: string;
  email: string;
  parentEmail?: string;
  role: "student" | "faculty" | "admin";
};

type VerifiedAdmin = {
  uid: string;
  email?: string;
  role?: string;
  auth: NonNullable<typeof adminAuth>;
  db: NonNullable<typeof adminDb>;
};

async function verifyAdminUser(idToken: string): Promise<VerifiedAdmin> {
  if (adminInitializationError) {
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    throw new Error("Server error: Admin services are not initialized.");
  }

  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const adminSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
  const adminData = adminSnap.data();
  if (!adminSnap.exists || adminData?.role !== "admin") {
    throw new Error("Only admins can manage users.");
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    role: adminData.role,
    auth: adminAuth,
    db: adminDb,
  };
}

async function recordUserAuditLog(
  actor: VerifiedAdmin,
  action: AuditAction,
  targetId: string,
  targetEmail: string | undefined,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await writeAuditLog({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      targetType: "user",
      targetId,
      targetEmail,
      details,
    });
  } catch (error) {
    console.error("[AuditLog] Failed to record user audit log:", error);
  }
}

function normalizeProfile(profile: ManagedUserProfile): ManagedUserProfile {
  const email = profile.email.trim().toLowerCase();
  if (!email || !profile.name.trim() || !profile.studentId.trim()) {
    throw new Error("Name, student/staff ID, and email are required.");
  }
  if (!["student", "faculty", "admin"].includes(profile.role)) {
    throw new Error("Invalid role selected.");
  }

  return {
    ...profile,
    email,
    name: profile.name.trim(),
    studentId: profile.studentId.trim(),
    parentEmail: profile.parentEmail?.trim() || "",
    currentYear: Number(profile.currentYear) || 0,
    currentSemester: Number(profile.currentSemester) || 0,
  };
}

export async function createManagedUser(
  idToken: string,
  profile: ManagedUserProfile,
  temporaryPassword: string,
): Promise<{ uid: string; authUserCreated: boolean }> {
  const actor = await verifyAdminUser(idToken);
  const normalizedProfile = normalizeProfile(profile);

  if (temporaryPassword.length < 6) {
    throw new Error("Temporary password must be at least 6 characters.");
  }

  let uid: string;
  let authUserCreated = false;

  try {
    const existingUser = await actor.auth.getUserByEmail(normalizedProfile.email);
    uid = existingUser.uid;
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
    const createdUser = await actor.auth.createUser({
      email: normalizedProfile.email,
      password: temporaryPassword,
      displayName: normalizedProfile.name,
      emailVerified: false,
      disabled: false,
    });
    uid = createdUser.uid;
    authUserCreated = true;
  }

  const profileData = {
    ...normalizedProfile,
    updatedAt: AdminFieldValue.serverTimestamp(),
    ...(authUserCreated ? { createdAt: AdminFieldValue.serverTimestamp() } : {}),
  };

  await actor.db.collection("users").doc(uid).set(profileData, { merge: true });
  await recordUserAuditLog(
    actor,
    authUserCreated ? "USER_CREATED" : "USER_PROFILE_LINKED",
    uid,
    normalizedProfile.email,
    {
      role: normalizedProfile.role,
      studentId: normalizedProfile.studentId,
      name: normalizedProfile.name,
    },
  );

  return { uid, authUserCreated };
}

export async function updateManagedUser(
  idToken: string,
  userId: string,
  profile: ManagedUserProfile,
): Promise<void> {
  const actor = await verifyAdminUser(idToken);
  const normalizedProfile = normalizeProfile(profile);
  const userRef = actor.db.collection("users").doc(userId);
  const existingSnap = await userRef.get();
  const previousData = existingSnap.data() || {};

  try {
    await actor.auth.updateUser(userId, {
      email: normalizedProfile.email,
      displayName: normalizedProfile.name,
    });
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  await userRef.set(
    {
      ...normalizedProfile,
      updatedAt: AdminFieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await recordUserAuditLog(actor, "USER_UPDATED", userId, normalizedProfile.email, {
    name: normalizedProfile.name,
    studentId: normalizedProfile.studentId,
    roleBefore: previousData.role || null,
    roleAfter: normalizedProfile.role,
  });
}

export async function deleteManagedUser(
  idToken: string,
  userId: string,
): Promise<void> {
  const actor = await verifyAdminUser(idToken);
  if (actor.uid === userId) {
    throw new Error("Admins cannot delete their own account.");
  }

  const userRef = actor.db.collection("users").doc(userId);
  const existingSnap = await userRef.get();
  const previousData = existingSnap.data() || {};

  try {
    await actor.auth.deleteUser(userId);
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  await userRef.delete();

  await recordUserAuditLog(actor, "USER_DELETED", userId, previousData.email, {
    name: previousData.name || null,
    studentId: previousData.studentId || null,
    role: previousData.role || null,
  });
}
