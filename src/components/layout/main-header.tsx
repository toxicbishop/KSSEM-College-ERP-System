"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { getSystemSettings } from "@/services/system-settings";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { Bell, Menu, UserCircle, LogOut } from "lucide-react";
import { db, auth } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { deleteCookie } from "@/lib/utils";

const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/grades", label: "Academics" },
  { href: "/fee-management", label: "Finance" },
  { href: "/classrooms", label: "Library" },
];

export function MainHeader() {
  const [collegeName, setCollegeName] = useState("KSSEM");
  const [appNameLoading, setAppNameLoading] = useState(true);
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [scholarId, setScholarId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        deleteCookie("firebaseAuthToken");
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        router.push("/signin");
      } catch (error) {
        console.error("Logout failed:", error);
        toast({
          title: "Logout Failed",
          description: "Could not log you out. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (user && db) {
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db!, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(
              data.name ||
                user.displayName ||
                user.email?.split("@")[0] ||
                "Student",
            );
            setScholarId(
              user.email === "pranavarun26@gmail.com"
                ? "1MTCG900"
                : data.studentId || user.uid.substring(0, 8),
            );
          } else {
            setUserName(
              user.displayName || user.email?.split("@")[0] || "Student",
            );
            setScholarId(user.uid.substring(0, 8));
          }
        } catch (error) {
          console.error("Error fetching header profile:", error);
          setUserName(user.displayName || "Student");
        }
      };
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const fetchAppName = async () => {
      setAppNameLoading(true);
      try {
        const settings = await getSystemSettings();
        if (settings && settings.applicationName) {
          setCollegeName(settings.applicationName);
        }
      } catch (error) {
        console.error(
          "Error fetching application name for main header:",
          error,
        );
      } finally {
        setAppNameLoading(false);
      }
    };
    fetchAppName();
  }, []);

  const isNavActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-kssem-navy shadow-md border-b border-kssem-navy-light/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {isMobile ? (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar
                  isCollapsed={false}
                  toggleCollapse={() => {}}
                  onLinkClick={() => setIsSidebarOpen(false)}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <div className="bg-white p-1 rounded-sm flex items-center justify-center">
              <Image
                src="/Assets/collage-logo.png"
                alt="KSSEM Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-white font-serif font-bold text-lg leading-none tracking-wide">
              {appNameLoading ? "..." : collegeName}
            </span>
            <span className="text-slate-300 text-[10px] uppercase tracking-wider font-medium">
              Portal Access
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = isNavActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors relative ${
                  active
                    ? "text-kssem-gold font-semibold after:content-[''] after:absolute after:-bottom-[22px] after:left-0 after:w-full after:h-[3px] after:bg-kssem-gold"
                    : "text-slate-300 hover:text-white"
                }`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-6">
          <button className="text-slate-300 hover:text-white transition-colors hidden sm:block">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

          <button
            onClick={handleLogout}
            className="text-slate-300 hover:text-kssem-gold transition-colors flex items-center gap-2 group"
            title="Logout">
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden lg:block">Logout</span>
          </button>

          <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
          <Link href="/profile" className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-semibold leading-tight">
                {userName || "Student"}
              </p>
              <p className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
                USN: {scholarId || "N/A"}
              </p>
            </div>
            <Avatar className="h-9 w-9 rounded-full border border-kssem-gold/50">
              <AvatarImage
                src={user?.photoURL || ""}
                alt={user?.displayName || "User profile"}
              />
              <AvatarFallback className="bg-kssem-gold/20 text-kssem-gold text-sm font-bold">
                {user ? (
                  getInitials(
                    userName || user.displayName || user.email || "User",
                  )
                ) : (
                  <UserCircle className="h-5 w-5 text-slate-300" />
                )}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
