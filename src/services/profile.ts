import { apiGet, apiPatch } from '@/lib/api-client';

export interface StudentProfile {
  studentId: string;
  name: string;
  profilePhotoUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  email?: string;
  permanentAddress?: string;
  currentAddress?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  enrollmentNumber?: string;
  courseProgram?: string;
  department?: string;
  currentYear?: number;
  currentSemester?: number;
  academicAdvisorName?: string;
  sectionOrBatch?: string;
  admissionDate?: string;
  modeOfAdmission?: string;
  idCardUrl?: string;
  admissionLetterUrl?: string;
  marksheet10thUrl?: string;
  marksheet12thUrl?: string;
  migrationCertificateUrl?: string;
  bonafideCertificateUrl?: string;
  uploadedPhotoUrl?: string;
  uploadedSignatureUrl?: string;
  examRegistrationStatus?: string;
  admitCardUrl?: string;
  internalExamTimetableUrl?: string;
  externalExamTimetableUrl?: string;
  resultsAndGradeCardsUrl?: string;
  revaluationRequestStatus?: string;
  revaluationRequestLink?: string;
  role?: string;
  parentEmail?: string;
}

export async function getStudentProfile(
  studentId: string
): Promise<StudentProfile | null> {
  try {
    const profile = await apiGet<StudentProfile>(`/api/academic/profile/${studentId}`);
    return profile;
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return null;
  }
}

export async function updateStudentProfile(
  studentId: string,
  profileData: Partial<StudentProfile>
): Promise<void> {
  try {
    await apiPatch(`/api/academic/profile/${studentId}`, profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Could not update your profile. Please try again.');
  }
}
