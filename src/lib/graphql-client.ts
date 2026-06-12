import { GraphQLClient } from 'graphql-request';

const endpoint = '/api/graphql';

export const client = new GraphQLClient(endpoint);

export const queries = {
  GET_STUDENT_PROFILE: `
    query GetStudentProfile($uid: String!) {
      getStudentProfile(uid: $uid) {
        uid
        email
        name
        role
        department
        courseProgram
        currentYear
        currentSemester
      }
    }
  `,
  GET_ALL_ANNOUNCEMENTS: `
    query GetAllAnnouncements {
      getAllAnnouncements {
        id
        title
        content
        timestamp
        authorName
      }
    }
  `,
  GET_ATTENDANCE_RECORDS: `
    query GetAttendanceRecords($studentId: String!) {
      getAttendanceRecords(studentId: $studentId) {
        id
        date
        status
        courseId
      }
    }
  `,
};

export const mutations = {
  UPDATE_STUDENT_PROFILE: `
    mutation UpdateStudentProfile($uid: String!, $profileData: StudentProfileInput!) {
      updateStudentProfile(uid: $uid, profileData: $profileData) {
        uid
        name
      }
    }
  `,
};
