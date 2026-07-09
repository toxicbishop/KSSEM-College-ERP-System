/**
 * Centralised input-validation schemas using Zod.
 *
 * These schemas are used by service wrappers to validate incoming data
 * before it is sent to the API gateway.  They catch errors early on the
 * client / server-action side and return clear, user-friendly messages.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Profile Change Request Validation
// ---------------------------------------------------------------------------

export const ProfileChangeRequestFieldWhitelist = [
  'name',
  'email',
  'contactNumber',
  'gender',
  'permanentAddress',
  'currentAddress',
  'bloodGroup',
  'emergencyContactName',
  'emergencyContactNumber',
  'parentEmail',
] as const;

export const createProfileChangeRequestSchema = z.object({
  fieldName: z.enum(ProfileChangeRequestFieldWhitelist, {
    required_error: 'Field name is required',
    invalid_type_error: 'Field name must be one of the allowed fields',
  }),
  oldValue: z.string({
    required_error: 'Old value is required',
  }),
  newValue: z.string({
    required_error: 'New value is required',
  }).min(1, 'New value cannot be empty'),
}).refine((data) => data.oldValue !== data.newValue, {
  message: 'Old and new values must differ',
  path: ['newValue'],
});

export type CreateProfileChangeRequestInput = z.infer<typeof createProfileChangeRequestSchema>;

// ---------------------------------------------------------------------------
// Approve / Deny Request Validation
// ---------------------------------------------------------------------------

export type ApproveProfileChangeRequestInput = z.infer<typeof approveProfileChangeRequestSchema>;
export type DenyProfileChangeRequestInput = z.infer<typeof denyProfileChangeRequestSchema>;

export const approveProfileChangeRequestSchema = z.object({
  requestId: z.string({
    required_error: 'Request ID is required',
  }).min(1, 'Request ID cannot be empty'),
  adminNotes: z.string().optional(),
  newValue: z.string().optional(),
});

export const denyProfileChangeRequestSchema = z.object({
  requestId: z.string({
    required_error: 'Request ID is required',
  }).min(1, 'Request ID cannot be empty'),
  adminNotes: z.string({
    required_error: 'Denial reason is required',
  }).min(5, 'Denial reason must be at least 5 characters'),
});

// ---------------------------------------------------------------------------
// Student Profile Update Validation
// ---------------------------------------------------------------------------

export const updateStudentProfileSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  contactNumber: z.string()
    .regex(/^\+?[\d\s-]{7,15}$/, 'Invalid phone number format')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  permanentAddress: z.string().min(5, 'Address must be at least 5 characters').optional(),
  currentAddress: z.string().min(5, 'Address must be at least 5 characters').optional(),
  emergencyContactName: z.string().min(2, 'Contact name must be at least 2 characters').optional(),
  emergencyContactNumber: z.string()
    .regex(/^\+?[\d\s-]{7,15}$/, 'Invalid phone number format')
    .optional(),
  department: z.string().min(1, 'Department is required').optional(),
  courseProgram: z.string().min(1, 'Course/Program is required').optional(),
  currentYear: z.number().int().min(1).max(5).optional(),
  currentSemester: z.number().int().min(1).max(10).optional(),
  parentEmail: z.string().email('Invalid parent email').optional(),
}).strict();

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

// ---------------------------------------------------------------------------
// Attendance Validation
// ---------------------------------------------------------------------------

export const submitAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  lectureId: z.string().min(1, 'Lecture ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['present', 'absent', 'late', 'excused'], {
    required_error: 'Attendance status is required',
    invalid_type_error: 'Status must be one of: present, absent, late, excused',
  }),
});

export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;

// ---------------------------------------------------------------------------
// Grade Validation
// ---------------------------------------------------------------------------

export const gradeInputSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  grade: z.string().min(1, 'Grade is required'),
  score: z.number().min(0, 'Score must be non-negative'),
  maxScore: z.number().positive('Max score must be positive'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'),
}).strict();

export type GradeInput = z.infer<typeof gradeInputSchema>;

// ---------------------------------------------------------------------------
// Classroom Validation
// ---------------------------------------------------------------------------

export const createClassroomSchema = z.object({
  name: z.string().min(2, 'Classroom name must be at least 2 characters'),
  courseCode: z.string().min(1, 'Course code is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  facultyName: z.string().min(2, 'Faculty name must be at least 2 characters'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in YYYY-YYYY format'),
  semester: z.string().min(1, 'Semester is required'),
  studentIds: z.array(z.string()).optional(),
  invitedFacultyIds: z.array(z.string()).optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;

// ---------------------------------------------------------------------------
// Notification Validation
// ---------------------------------------------------------------------------

export const markNotificationReadSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

// ---------------------------------------------------------------------------
// Generic error formatter — converts Zod errors to a flat string message
// ---------------------------------------------------------------------------

export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.') || 'root';
    return `${path}: ${issue.message}`;
  });
  return issues.join('; ');
}
