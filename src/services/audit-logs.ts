"use server";

import {
  adminDb,
  adminInitializationError,
} from "@/lib/firebase/admin.server";
import { FieldValue as AdminFieldValue } from "firebase-admin/firestore";

export type AuditAction =
  | "USER_CREATED"
  | "USER_PROFILE_LINKED"
  | "USER_UPDATED"
  | "USER_DELETED";

export type AuditLogInput = {
  actorUid: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  targetType: "user";
  targetId: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  if (adminInitializationError) {
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb) {
    throw new Error("Server error: Admin database is not initialized.");
  }

  await adminDb.collection("auditLogs").add({
    ...input,
    createdAt: AdminFieldValue.serverTimestamp(),
  });
}
