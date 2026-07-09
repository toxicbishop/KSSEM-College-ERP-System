import { GraphQLClient } from 'graphql-request';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';
const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || `${GATEWAY_URL}/query`;

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
