import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/pages/(app)/layout';

// Public pages
const LandingPage        = lazy(() => import('@/pages/page'));
const SignInPage         = lazy(() => import('@/pages/signin/page'));
const SignUpPage         = lazy(() => import('@/pages/signup/page'));
const AboutPage          = lazy(() => import('@/pages/about/page'));
const ContactPage        = lazy(() => import('@/pages/contact/page'));
const FaqPage            = lazy(() => import('@/pages/faq/page'));
const PrivacyPage        = lazy(() => import('@/pages/privacy-policy/page'));
const TermsPage          = lazy(() => import('@/pages/terms-of-service/page'));
const MaintenancePage    = lazy(() => import('@/pages/maintenance/page'));

// Protected / app pages — student
const DashboardPage      = lazy(() => import('@/pages/(app)/dashboard/page'));
const AttendancePage     = lazy(() => import('@/pages/(app)/attendance/page'));
const GradesPage         = lazy(() => import('@/pages/(app)/grades/page'));
const ClassroomsPage     = lazy(() => import('@/pages/(app)/classrooms/page'));
const ProfilePage        = lazy(() => import('@/pages/(app)/profile/page'));
const FeeManagementPage  = lazy(() => import('@/pages/(app)/fee-management/page'));
const LeaveApplicationPage = lazy(() => import('@/pages/(app)/leave-application/page'));
const AppointmentsPage   = lazy(() => import('@/pages/(app)/appointments/page'));
const VotingPage         = lazy(() => import('@/pages/(app)/voting/page'));

// Admin pages
const AdminPage          = lazy(() => import('@/pages/(app)/admin/page'));
const AuditLogsPage      = lazy(() => import('@/pages/(app)/admin/audit-logs/page'));
const NotificationsPage  = lazy(() => import('@/pages/(app)/admin/notifications/page'));
const RequestsPage       = lazy(() => import('@/pages/(app)/admin/requests/page'));
const SettingsPage       = lazy(() => import('@/pages/(app)/admin/settings/page'));

// Faculty pages
const FacultyPage            = lazy(() => import('@/pages/(app)/faculty/page'));
const FacultyAttendancePage  = lazy(() => import('@/pages/(app)/faculty/attendance/page'));
const FacultyClassroomsPage  = lazy(() => import('@/pages/(app)/faculty/classrooms/page'));
const FacultyClassroomStudentsPage = lazy(() => import('@/pages/(app)/faculty/classrooms/[classroomId]/students/page'));
const FacultyGradesPage      = lazy(() => import('@/pages/(app)/faculty/grades/page'));
const FacultyStudentsPage    = lazy(() => import('@/pages/(app)/faculty/students/page'));
const FacultyStudentDetailPage = lazy(() => import('@/pages/(app)/faculty/students/[studentId]/page'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Public routes */}
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/signin"            element={<SignInPage />} />
          <Route path="/signup"            element={<SignUpPage />} />
          <Route path="/about"             element={<AboutPage />} />
          <Route path="/contact"           element={<ContactPage />} />
          <Route path="/faq"               element={<FaqPage />} />
          <Route path="/privacy-policy"    element={<PrivacyPage />} />
          <Route path="/terms-of-service"  element={<TermsPage />} />
          <Route path="/maintenance"       element={<MaintenancePage />} />

          {/* Protected authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              {/* Student routes */}
              <Route path="/dashboard"        element={<DashboardPage />} />
              <Route path="/attendance"       element={<AttendancePage />} />
              <Route path="/grades"           element={<GradesPage />} />
              <Route path="/classrooms"       element={<ClassroomsPage />} />
              <Route path="/profile"          element={<ProfilePage />} />
              <Route path="/fee-management"   element={<FeeManagementPage />} />
              <Route path="/leave-application" element={<LeaveApplicationPage />} />
              <Route path="/appointments"     element={<AppointmentsPage />} />
              <Route path="/voting"           element={<VotingPage />} />

              {/* Admin routes */}
              <Route path="/admin"                    element={<AdminPage />} />
              <Route path="/admin/audit-logs"         element={<AuditLogsPage />} />
              <Route path="/admin/notifications"      element={<NotificationsPage />} />
              <Route path="/admin/requests"           element={<RequestsPage />} />
              <Route path="/admin/settings"           element={<SettingsPage />} />

              {/* Faculty routes */}
              <Route path="/faculty"                                             element={<FacultyPage />} />
              <Route path="/faculty/attendance"                                  element={<FacultyAttendancePage />} />
              <Route path="/faculty/classrooms"                                  element={<FacultyClassroomsPage />} />
              <Route path="/faculty/classrooms/:classroomId/students"            element={<FacultyClassroomStudentsPage />} />
              <Route path="/faculty/grades"                                      element={<FacultyGradesPage />} />
              <Route path="/faculty/students"                                    element={<FacultyStudentsPage />} />
              <Route path="/faculty/students/:studentId"                         element={<FacultyStudentDetailPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
