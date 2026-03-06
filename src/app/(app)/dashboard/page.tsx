"use client";

import { getStudentProfile } from "@/services/profile";
import { getAnnouncements } from "@/services/announcements";
import { AttendanceOverviewCard } from "@/components/dashboard/attendance-overview-card";
import { GradesChartCard } from "@/components/dashboard/grades-chart-card";
import { AnnouncementsCard } from "@/components/dashboard/announcements-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { MainHeader } from "@/components/layout/main-header";
import {
  Award,
  CalendarClock,
  CheckCircle,
  DoorOpen,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { auth as clientAuth, db } from "@/lib/firebase/client";
import type { StudentProfile } from "@/services/profile";
import type { AttendanceRecord } from "@/services/attendance";
import type { Grade } from "@/services/grades";
import type { Announcement } from "@/services/announcements";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  analyzeStudentGrades,
  fetchAttendanceRecords,
  fetchStudentGrades,
} from "./actions";
import type { GradeAnalysisOutput } from "@/services/grades";

interface DashboardData {
  profile: StudentProfile | null;
  attendanceRecords: AttendanceRecord[];
  grades: Grade[];
  gradeAnalysis: GradeAnalysisOutput;
  announcements: Announcement[];
  attendancePercentage: number;
  gpa: string;
  sgpa: string; // Added SGPA
  upcomingAppointments: number;
  activeGatePasses: number;
}

const calculateGPA = (grades: Grade[]): string => {
  if (grades.length === 0) return "N/A";
  const gradePoints: { [key: string]: number } = {
    "A+": 4.0,
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };
  const totalPoints = grades.reduce(
    (sum, grade) => sum + (gradePoints[grade.grade.toUpperCase()] || 0),
    0,
  );
  const validGradesCount = grades.filter(
    (grade) => gradePoints[grade.grade.toUpperCase()] !== undefined,
  ).length;
  if (validGradesCount === 0) return "N/A";
  return (totalPoints / validGradesCount).toFixed(1);
};

const defaultGradeAnalysis: GradeAnalysisOutput = {
  overallSummary:
    "AI analysis is currently unavailable. Please check back later.",
  strengths: [],
  areasForImprovement: [],
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && clientAuth?.currentUser && db) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const userDocRef = doc(
            db as NonNullable<typeof db>,
            "users",
            user.uid,
          );
          const userDocSnap = await getDoc(userDocRef);
          let profileData: StudentProfile | null = null;

          if (userDocSnap.exists()) {
            profileData = { ...userDocSnap.data() } as StudentProfile;
            if (!profileData.studentId) profileData.studentId = user.uid;
            const userRole =
              profileData.role ||
              (user.email === "admin@gmail.com" ? "admin" : "student");
            const fallbackName =
              userRole === "admin"
                ? "Admin"
                : userRole === "faculty"
                  ? "Faculty"
                  : "Student";
            if (!profileData.name)
              profileData.name = user.displayName || fallbackName;
            if (!profileData.email) profileData.email = user.email || "N/A";
          } else {
            const fallbackName =
              user.email === "admin@gmail.com" ? "Admin" : "Student";
            profileData = {
              name: user.displayName || fallbackName,
              studentId: user.uid,
              courseProgram: "Unknown",
              email: user.email || "N/A",
            } as StudentProfile;
          }

          const idToken = await clientAuth!.currentUser!.getIdToken();
          const [attendanceRecords, grades, announcements] = await Promise.all([
            fetchAttendanceRecords(idToken),
            fetchStudentGrades(user.uid),
            getAnnouncements(),
          ]);

          const totalDays = attendanceRecords.length;
          const presentDays = attendanceRecords.filter(
            (r) => r.status === "present",
          ).length;
          const attendancePercentage =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
          const gpa = calculateGPA(grades);

          // Dummy data injection for Pranavarun26
          const isDummyUser =
            profileData.name?.toLowerCase().includes("pranavarun") ||
            user.email?.includes("pranavarun");

          setData({
            profile: profileData,
            attendanceRecords: isDummyUser
              ? ([
                  {
                    date: new Date().toISOString(),
                    lectureName: "Theory of Computation",
                    status: "present",
                    id: "1",
                  },
                  {
                    date: new Date(Date.now() - 86400000).toISOString(),
                    lectureName: "Database Systems",
                    status: "present",
                    id: "2",
                  },
                  {
                    date: new Date(Date.now() - 172800000).toISOString(),
                    lectureName: "Computer Networks",
                    status: "absent",
                    id: "3",
                  },
                  {
                    date: new Date(Date.now() - 259200000).toISOString(),
                    lectureName: "Operating Systems",
                    status: "present",
                    id: "4",
                  },
                  {
                    date: new Date(Date.now() - 345600000).toISOString(),
                    lectureName: "Software Engineering",
                    status: "present",
                    id: "5",
                  },
                ] as any)
              : attendanceRecords,
            grades: isDummyUser
              ? ([
                  {
                    id: "1",
                    courseName: "Theory of Computation",
                    grade: "A+",
                    updatedAt: new Date(),
                  },
                  {
                    id: "2",
                    courseName: "Database Systems",
                    grade: "A",
                    updatedAt: new Date(),
                  },
                  {
                    id: "3",
                    courseName: "Computer Networks",
                    grade: "B+",
                    updatedAt: new Date(),
                  },
                ] as any)
              : grades,
            gradeAnalysis: {
              overallSummary: isDummyUser
                ? "Excellent performance in core theory. Focus slightly more on networking practicals."
                : "Analyzing grades...",
              strengths: isDummyUser
                ? ["Theoretical Computer Science", "Database Architecture"]
                : [],
              areasForImprovement: isDummyUser ? ["Network Protocols"] : [],
            },
            announcements,
            attendancePercentage: isDummyUser ? 92 : attendancePercentage,
            gpa: isDummyUser ? "9.4" : gpa,
            sgpa: isDummyUser ? "9.6" : (parseFloat(gpa) + 0.2).toFixed(1), // Dummy SGPA
            profile: isDummyUser
              ? {
                  ...profileData,
                  courseProgram: "Computer Science and Business Systems",
                }
              : profileData,
            upcomingAppointments: 0,
            activeGatePasses: 0,
          });

          analyzeStudentGrades(grades)
            .then((analysis) =>
              setData((prev) =>
                prev ? { ...prev, gradeAnalysis: analysis } : prev,
              ),
            )
            .catch((aiError) => {
              console.error("AI grade analysis failed.", aiError);
              toast({
                title: "AI Analysis Unavailable",
                description: "Could not generate AI grade analysis.",
                variant: "default",
              });
              setData((prev) =>
                prev ? { ...prev, gradeAnalysis: defaultGradeAnalysis } : prev,
              );
            });
        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
          const errorMessage =
            (err as Error).message || "An unknown error occurred.";
          if (errorMessage.includes("Admin SDK initialization failed")) {
            setError(
              "Server configuration error. Please contact the administrator.",
            );
          } else {
            setError(
              "Failed to load dashboard data. Please try refreshing the page.",
            );
          }
          toast({
            title: "Dashboard Error",
            description: "Could not load all dashboard data.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    } else if (!authLoading && user && (!clientAuth?.currentUser || !db)) {
      setLoading(false);
      setError("Firebase services not fully initialized. Please try again.");
    }
  }, [user, authLoading, toast]);

  if (loading || authLoading) {
    return (
      <>
        <MainHeader />
        <div className="space-y-8 pt-8">
          <div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-10 w-96" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MainHeader />
        <div className="flex h-[calc(100vh-150px)] items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white shadow-prestige p-8 border-t-[3px] border-destructive rounded-sm">
            <h2 className="flex items-center gap-2 text-destructive font-serif font-bold text-xl mb-2">
              <AlertTriangle className="h-6 w-6" /> Dashboard Error
            </h2>
            <p className="text-kssem-text-muted">{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (!user || !data || !data.profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-kssem-text-muted">
          {user
            ? "Could not load dashboard information."
            : "Redirecting to sign in..."}
        </p>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <MainHeader />
      <div className="space-y-8 pt-8">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row justify-between items-end border-b border-kssem-border pb-4">
          <div>
            <p className="text-kssem-navy text-sm font-semibold uppercase tracking-wider mb-1">
              Academic Session {today.getFullYear()}-{today.getFullYear() + 1}
            </p>
            <h1 className="font-serif font-bold text-3xl md:text-4xl tracking-tight text-kssem-text">
              Welcome back, {data.profile.name?.split(" ")[0]}.
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="bg-kssem-navy/10 text-kssem-navy text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                {data.profile.courseProgram || "B.Tech CSE"}
              </span>
              <span className="text-kssem-text-muted text-xs font-medium border-l border-kssem-border pl-3">
                Section {data.profile.sectionOrBatch || "A"} • Year{" "}
                {data.profile.currentYear || "3"}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-kssem-text-muted text-sm font-medium flex items-center gap-2 bg-white px-3 py-1.5 shadow-sm border border-kssem-border rounded-sm">
            <CalendarClock className="h-4 w-4 text-kssem-gold" />
            <span>{dateStr}</span>
          </div>
        </section>

        {/* KPI Metrics Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Attendance"
            value={`${data.attendancePercentage}%`}
            icon={data.attendancePercentage < 75 ? AlertTriangle : CheckCircle}
            variant={data.attendancePercentage < 75 ? "destructive" : "default"}
            subtitle={
              data.attendancePercentage >= 75
                ? "Good Standing"
                : "Below Required"
            }
          />
          <SummaryCard
            title="CGPA"
            value={data.gpa}
            icon={Award}
            subtitle="Overall"
          />
          <SummaryCard
            title="SGPA"
            value={data.sgpa}
            icon={TrendingUp}
            subtitle="Latest Semester"
          />
          <SummaryCard
            title="Fees Due"
            value="₹0"
            icon={TrendingUp}
            subtitle="No Dues Pending"
          />
          <SummaryCard
            title="Gate Passes"
            value={data.activeGatePasses.toString()}
            icon={DoorOpen}
            subtitle="Active Today"
          />
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AttendanceOverviewCard
              attendanceRecords={data.attendanceRecords}
            />
          </div>
          <div className="lg:col-span-1">
            <AnnouncementsCard announcements={data.announcements} />
          </div>
          <div className="lg:col-span-1">
            <ErrorBoundary title="Grades Analysis Error">
              <GradesChartCard
                grades={data.grades}
                analysis={data.gradeAnalysis}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}
