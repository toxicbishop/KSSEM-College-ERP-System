"use client";

import { MainHeader } from "@/components/layout/main-header";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  UserSearch,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  User,
} from "lucide-react";

const quickActions = [
  {
    href: "/faculty/classrooms",
    icon: BookOpen,
    title: "Manage Classrooms",
    description: "Create, view, and update your student groups.",
  },
  {
    href: "/faculty/students",
    icon: UserSearch,
    title: "View Student Profiles",
    description: "Look up students and view their performance.",
  },
  {
    href: "/faculty/attendance",
    icon: CalendarCheck,
    title: "Update Attendance",
    description: "Record and manage attendance for your lectures.",
  },
  {
    href: "/faculty/grades",
    icon: GraduationCap,
    title: "Manage Grades",
    description: "Enter and update student grades.",
  },
];

export default function FacultyDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <>
      <MainHeader />
      <div className="space-y-8 pt-8">
        {/* Welcome Header */}
        <section className="border-b border-kssem-border pb-6">
          <p className="text-kssem-navy text-sm font-semibold uppercase tracking-wider mb-1">
            Faculty Portal
          </p>
          <h1 className="font-serif font-bold text-3xl md:text-4xl tracking-tight text-kssem-text">
            Welcome back, {user?.displayName?.split(" ")[0] || "Faculty"}.
          </h1>
          <p className="text-kssem-text-muted text-sm mt-2">
            Manage your classrooms, students, attendance, and grades from here.
          </p>
        </section>

        {/* Quick Action Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card-prestige group hover:-translate-y-1 transition-transform duration-300 flex flex-col">
              <div className="bg-kssem-navy/5 text-kssem-navy p-3 rounded-sm w-fit mb-4 group-hover:bg-kssem-navy group-hover:text-white transition-colors">
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-kssem-navy text-base mb-1 group-hover:text-kssem-gold transition-colors">
                {action.title}
              </h3>
              <p className="text-kssem-text-muted text-sm flex-grow">
                {action.description}
              </p>
              <div className="flex items-center gap-1 text-kssem-navy text-xs font-bold uppercase tracking-wider mt-4 group-hover:text-kssem-gold transition-colors">
                <span>Open</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </section>

        {/* Quick Links */}
        <section className="bg-kssem-bg border border-kssem-border rounded-sm p-4 flex flex-wrap gap-4 items-center">
          <span className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
            Quick Links:
          </span>
          <Link
            href="/profile"
            className="text-kssem-navy text-sm font-semibold hover:text-kssem-gold transition-colors flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> My Profile
          </Link>
          <Link
            href="/dashboard"
            className="text-kssem-navy text-sm font-semibold hover:text-kssem-gold transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-3.5 w-3.5" /> Student Dashboard View
          </Link>
        </section>
      </div>
    </>
  );
}
