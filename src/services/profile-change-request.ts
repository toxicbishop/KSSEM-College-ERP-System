/**
 * Profile Change Request Service — gateway-backed (no more direct Firebase Admin).
 *
 * This module replaces the previous server-action-based implementation that
 * bypassed the Go microservices.  All profile-change-request operations now
 * go through the API Gateway (`/api/admin/*`) which routes to the Admin
 * microservice via gRPC.
 *
 * The admin-approval page and the student profile page use these wrappers
 * instead of calling `createProfileChangeRequest`, `approveProfileChangeRequest`,
 * and `denyProfileChangeRequest` server actions directly.
 */

import { apiPost, apiGet } from '@/lib/api-client';
import {
  createProfileChangeRequestSchema,
  approveProfileChangeRequestSchema,
  denyProfileChangeRequestSchema,
  formatZodError,
  type CreateProfileChangeRequestInput as ValidatedCreateInput,
  type ApproveProfileChangeRequestInput as ValidatedApproveInput,
  type DenyProfileChangeRequestInput as ValidatedDenyInput,
} from './validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileChangeRequestStatus = 'pending' | 'approved' | 'denied';

export interface ProfileChangeRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  requestedAt: string;       // ISO-8601 timestamp from the backend
  status: ProfileChangeRequestStatus;
  adminNotes?: string;
  resolvedAt?: string;       // ISO-8601 timestamp, undefined for pending
}

// ---------------------------------------------------------------------------
// Create a new profile change request (student workflow)
// ---------------------------------------------------------------------------

// Re-export the validated type from the validation module for convenience.
export type CreateProfileChangeRequestInput = ValidatedCreateInput;

// Re-export for convenience so existing callers don't break.
export type ApproveProfileChangeRequestInput = ValidatedApproveInput;
export type DenyProfileChangeRequestInput = ValidatedDenyInput;

export async function createProfileChangeRequest(
  input: CreateProfileChangeRequestInput,
): Promise<{ id: string }> {
  // Validate on the client / server-action side before hitting the gateway.
  const validated = createProfileChangeRequestSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(`Validation failed: ${formatZodError(validated.error)}`);
  }

  const res = await apiPost<{ id: string }>('/api/admin/profile-change-requests', validated.data);
  return res;
}

// ---------------------------------------------------------------------------
// List all profile change requests (admin workflow)
// ---------------------------------------------------------------------------

export async function getProfileChangeRequests(): Promise<ProfileChangeRequest[]> {
  const res = await apiGet<ProfileChangeRequest[]>('/api/admin/profile-change-requests');
  return res ?? [];
}

// ---------------------------------------------------------------------------
// Approve a profile change request (admin workflow)
// ---------------------------------------------------------------------------

export async function approveProfileChangeRequest(
  input: ApproveProfileChangeRequestInput,
): Promise<void> {
  const validated = approveProfileChangeRequestSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(`Validation failed: ${formatZodError(validated.error)}`);
  }

  await apiPost(`/api/admin/profile-change-requests/${validated.data.requestId}/approve`, {
    adminNotes: validated.data.adminNotes || '',
    newValue: validated.data.newValue || '',
  });
}

// ---------------------------------------------------------------------------
// Deny a profile change request (admin workflow)
// ---------------------------------------------------------------------------

export async function denyProfileChangeRequest(
  input: DenyProfileChangeRequestInput,
): Promise<void> {
  const validated = denyProfileChangeRequestSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(`Validation failed: ${formatZodError(validated.error)}`);
  }

  await apiPost(`/api/admin/profile-change-requests/${validated.data.requestId}/deny`, {
    adminNotes: validated.data.adminNotes,
  });
}
