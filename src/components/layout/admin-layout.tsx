"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  Settings,
  Edit,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Send,
  ClipboardList,
} from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { cn, deleteCookie } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to get initials from a name
const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSystemSettings } from "@/services/system-settings";
import { useIsMobile } from "@/hooks/use-is-mobile";
const adminNavigationItems = [
  { href: "/dashboard", label: "Student View", icon: LayoutDashboard },
  { href: "/admin", label: "User Management", icon: Users },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
  { href: "/admin/requests", label: "Change Requests", icon: Edit },
  { href: "/admin/notifications", label: "Notifications", icon: Send },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

const adminMobileNavItems = [
  { href: "/admin", label: "Users", icon: Users },
  { href: "/admin/requests", label: "Requests", icon: Edit },
  { href: "/admin/audit-logs", label: "Logs", icon: ClipboardList },
  { href: "/admin/notifications", label: "Notifs", icon: Send },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);
  const [collegeName, setCollegeName] = useState("KSSEM");
  const [appNameLoading, setAppNameLoading] = useState(true);

  useEffect(() => {
    if (isMobile === undefined) return;

    if (isMobile) {
      setIsSidebarCollapsed(true);
    } else {
      if (typeof window !== "undefined") {
        const storedCollapsedState = localStorage.getItem(
          "admin-sidebar-collapsed",
        );
        if (storedCollapsedState !== null) {
          setIsSidebarCollapsed(JSON.parse(storedCollapsedState));
        } else {
          setIsSidebarCollapsed(false);
        }
      }
    }
  }, [isMobile]);

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
          "Error fetching application name for admin sidebar:",
          error,
        );
      } finally {
        setAppNameLoading(false);
      }
    };
    fetchAppName();
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prevState) => {
      const newState = !prevState;
      if (typeof window !== "undefined" && !isMobile) {
        localStorage.setItem(
          "admin-sidebar-collapsed",
          JSON.stringify(newState),
        );
      }
      return newState;
    });
  };

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
    } else {
      console.error("Firebase auth is not initialized");
      toast({
        title: "Logout Failed",
        description: "Authentication system is not properly initialized.",
        variant: "destructive",
      });
    }
  };

  if (loading || appNameLoading || isMobile === undefined) {
    const initialSkeletonCollapse =
      (typeof window !== "undefined" && window.innerWidth < 768) || false;
    return (
      <div className="flex h-screen">
        <aside
          className={cn(
            "hidden bg-sidebar-background h-full p-6 md:flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
            initialSkeletonCollapse ? "w-20" : "w-64",
          )}>
          <div>
            <div
              className={cn(
                "flex items-center mb-10",
                initialSkeletonCollapse ? "justify-center" : "space-x-3",
              )}>
              <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
              {!initialSkeletonCollapse && (
                <div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              )}
            </div>
            <nav className="space-y-2">
              {adminNavigationItems.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-10 bg-muted rounded-md animate-pulse",
                    initialSkeletonCollapse ? "w-10 mx-auto" : "w-full",
                  )}></div>
              ))}
            </nav>
          </div>
          <div
            className={cn(
              "h-10 bg-muted rounded-md animate-pulse",
              initialSkeletonCollapse ? "w-10 mx-auto" : "w-full",
            )}></div>
        </aside>
        <main className="w-full flex-1 overflow-auto bg-background p-4 md:p-6">
          <div className="h-full w-full bg-muted rounded-md animate-pulse"></div>
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-x-hidden">
        <aside
          className={cn(
            "hidden bg-[#1A222C] text-[#8A99BB] h-screen p-4 md:flex flex-col justify-between shadow-lg border-r border-[#1e293b] transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-20 items-center" : "w-64",
          )}>
          <div>
            <div
              className={cn(
                "flex items-center mb-10",
                isSidebarCollapsed ? "justify-center pt-2" : "space-x-3",
              )}>
              <Image
                src="/Favicon/collage-logo.png"
                alt={`${collegeName} Admin Logo`}
                width={isSidebarCollapsed ? 32 : 40}
                height={isSidebarCollapsed ? 32 : 40}
                className={cn(isSidebarCollapsed ? "h-8 w-8" : "h-10 w-10")}
                data-ai-hint="college crest logo"
              />
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-sm font-semibold text-white">
                    {appNameLoading ? "Loading..." : collegeName}
                  </h1>
                  <p className="text-xs text-[#8A99BB]">Admin Panel</p>
                </div>
              )}
            </div>

            <nav className="space-y-2">
              {adminNavigationItems.map((item) => {
                const isActive =
                  (item.href === "/admin" &&
                    pathname.startsWith("/admin") &&
                    !pathname.includes("/settings") &&
                    !pathname.includes("/requests") &&
                    !pathname.includes("/notifications") &&
                    !pathname.includes("/audit-logs")) ||
                  pathname === item.href;
                const finalIsActive =
                  item.href === "/dashboard"
                    ? pathname.startsWith("/dashboard")
                    : isActive;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isSidebarCollapsed ? "justify-center" : "",
                          finalIsActive
                            ? "bg-[#0d9488]/20 text-[#2dd4bf] border-l-4 border-[#2dd4bf]"
                            : "text-[#8A99BB] hover:bg-white/5 hover:text-white",
                        )}>
                        <item.icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            finalIsActive ? "text-[#2dd4bf]" : "text-[#8A99BB]",
                          )}
                        />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isSidebarCollapsed && (
                      <TooltipContent
                        side="right"
                        className="bg-background text-foreground border-border">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto space-y-2 flex flex-col items-center">
            {user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-[#8A99BB] hover:bg-white/5 hover:text-white",
                      isSidebarCollapsed ? "justify-center" : "",
                    )}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={user?.photoURL || ""}
                        alt={user?.displayName || "Admin"}
                      />
                      <AvatarFallback className="text-[10px] bg-[#334155] text-white">
                        {getInitials(user?.displayName || user?.email || "AD")}
                      </AvatarFallback>
                    </Avatar>
                    {!isSidebarCollapsed && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                  <TooltipContent
                    side="right"
                    className="bg-background text-foreground border-border">
                    <p>Logout</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/signin")}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-[#8A99BB] hover:bg-white/5 hover:text-white",
                      isSidebarCollapsed ? "justify-center" : "",
                    )}>
                    <Home className="w-5 h-5 text-sidebar-primary shrink-0" />
                    {!isSidebarCollapsed && <span>Sign In</span>}
                  </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                  <TooltipContent
                    side="right"
                    className="bg-background text-foreground border-border">
                    <p>Sign In</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                onClick={toggleSidebarCollapse}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-[#8A99BB] hover:bg-white/5 hover:text-white",
                  isSidebarCollapsed ? "justify-center" : "",
                )}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }>
                {isSidebarCollapsed ? (
                  <ChevronsRight className="w-5 h-5 text-sidebar-primary shrink-0" />
                ) : (
                  <ChevronsLeft className="w-5 h-5 text-sidebar-primary shrink-0" />
                )}
                {!isSidebarCollapsed && <span>Collapse</span>}
              </Button>
            )}
          </div>
        </aside>

        <main className="w-full flex-1 overflow-auto bg-[#0F172A] pb-16 md:pb-0 text-slate-200">
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </main>
        {isMobile && <MobileNav items={adminMobileNavItems} />}
      </div>
    </TooltipProvider>
  );
}
