"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { FacultyLayout } from "@/components/layout/faculty-layout";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  Loader2,
  Home,
  User,
  Network,
  CheckSquare,
  GraduationCap,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";

type UserRole = "admin" | "faculty" | "student" | null;

const studentMobileNavItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/grades", label: "Grades", icon: GraduationCap },
  { href: "/classrooms", label: "Classrooms", icon: Network },
  { href: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (loading) {
      setCheckingRole(true);
      return;
    }

    if (!user) {
      setUserRole(null);
      setCheckingRole(false);
      if (
        pathname !== "/signin" &&
        pathname !== "/signup" &&
        pathname !== "/maintenance"
      ) {
        router.push("/signin");
      }
      return;
    }

    setCheckingRole(true);
    if (db) {
      const userDocRef = doc(db, "users", user.uid);
      getDoc(userDocRef)
        .then((userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const roleFromDb = userData.role;
            if (
              roleFromDb === "admin" ||
              roleFromDb === "faculty" ||
              roleFromDb === "student"
            ) {
              setUserRole(roleFromDb);
            } else {
              setUserRole("student");
            }
          } else {
            setUserRole("student");
          }
        })
        .catch((error) => {
          console.error("Error fetching user role:", error);
          setUserRole("student");
        })
        .finally(() => {
          setCheckingRole(false);
        });
    } else {
      setUserRole("student");
      setCheckingRole(false);
    }
  }, [user, loading, router, pathname]);

  if (loading || checkingRole || isMobile === undefined) {
    return (
      <div className="flex h-screen bg-kssem-bg items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-kssem-navy" />
          <p className="text-kssem-text-muted text-sm">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading && !checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-kssem-bg">
        <Loader2 className="h-10 w-10 animate-spin text-kssem-navy" />
        <p className="ml-3 text-lg text-kssem-text-muted">
          Redirecting to sign in...
        </p>
      </div>
    );
  }

  if (user) {
    if (userRole === "admin") {
      return <AdminLayout>{children}</AdminLayout>;
    }
    if (userRole === "faculty") {
      return <FacultyLayout>{children}</FacultyLayout>;
    }

    // Student layout — header-first, no sidebar on desktop
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-kssem-bg">
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-5 pb-20 sm:px-6 md:py-8 md:pb-8">
          {children}
        </main>
        <Footer />
        {isMobile && <MobileNav items={studentMobileNavItems} />}
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-kssem-bg">
      <Loader2 className="h-10 w-10 animate-spin text-kssem-navy" />
      <p className="ml-3 text-lg text-kssem-text-muted">
        Preparing application...
      </p>
    </div>
  );
}
