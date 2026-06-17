import * as announcementService from "@/services/announcements";
import * as academicCalendarService from "@/services/academic-calendar";
import * as attendanceService from "@/services/attendance";
import * as classroomService from "@/services/classroom";
import * as gradeService from "@/services/grades";
import * as profileChangeRequestService from "@/services/profile-change-request";
import * as profileService from "@/services/profile";
import * as systemSettingsService from "@/services/system-settings";

export const resolvers = {
  Query: {
    getStudentProfile: async (_: any, { uid }: { uid: string }, { idToken }: { idToken: string }) => {
      return await profileService.getStudentProfile(idToken, uid);
    },
    getAllAnnouncements: async () => {
      return await announcementService.getAnnouncements();
    },
    getAcademicCalendarEvents: async () => {
      return await academicCalendarService.getAcademicCalendar();
    },
    getAttendanceRecords: async (_: any, { studentId }: { studentId: string }, { idToken }: { idToken: string }) => {
      return await attendanceService.getAttendanceRecords(idToken, studentId);
    },
    getLectureAttendanceForDate: async (_: any, { date, courseId }: { date: string, courseId: string }, { idToken }: { idToken: string }) => {
      return await attendanceService.getLectureAttendanceForDate(idToken, date, courseId);
    },
    getClassroomsByFaculty: async (_: any, __: any, { idToken }: { idToken: string }) => {
      return await classroomService.getClassroomsByFaculty(idToken);
    },
    getStudentsInClassroom: async (_: any, { classroomId }: { classroomId: string }, { idToken }: { idToken: string }) => {
      return await classroomService.getStudentsInClassroom(idToken, classroomId);
    },
    getGrades: async (_: any, { studentId }: { studentId: string }) => {
      return await gradeService.getGrades(studentId);
    },
    getProfileChangeRequests: async (_: any, __: any, { idToken }: { idToken: string }) => {
      return await profileChangeRequestService.getProfileChangeRequests(idToken);
    },
    getSystemSettings: async () => {
      return await systemSettingsService.getSystemSettings();
    },
  },
  Mutation: {
    updateStudentProfile: async (_: any, { uid, profileData }: { uid: string, profileData: any }, { idToken }: { idToken: string }) => {
      await profileService.updateStudentProfile(idToken, profileData);
      return await profileService.getStudentProfile(idToken, uid);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    submitLectureAttendance: async (_root: unknown, _args: unknown, _ctx: unknown) => {
      // submitLectureAttendance(idToken, attendanceData) - need to check signature
      return null;
    },
    createClassroom: async (_: any, { classroom }: { classroom: any }, { idToken }: { idToken: string }) => {
      return await classroomService.createClassroom(idToken, classroom.name, classroom.courseCode);
    },
    removeStudentFromClassroom: async (_: any, { classroomId, studentId }: { classroomId: string, studentId: string }, { idToken }: { idToken: string }) => {
      return await classroomService.removeStudentFromClassroom(idToken, classroomId, studentId);
    },
    updateSystemSettings: async (_: any, { settings }: { settings: any }) => {
      await systemSettingsService.updateSystemSettings(settings);
      return await systemSettingsService.getSystemSettings();
    },
  }
};
