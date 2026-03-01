"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { getSystemSettings } from "@/services/system-settings";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/context/auth-context";
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

export function MainHeader() {
  const [collegeName, setCollegeName] = useState("KSSEM");
  const [appNameLoading, setAppNameLoading] = useState(true);
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[#2a3441] bg-[#1A222C] px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-[#334155] text-[#8A99BB] hover:bg-[#222B36]">
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
          <Image
            src="/college-logo.png"
            alt="College Logo"
            width={40}
            height={40}
            className="h-8 w-8 md:h-10 md:w-10"
            data-ai-hint="college crest logo"
          />
        )}
        <div>
          <h1 className="text-base font-semibold text-white md:text-xl">
            {appNameLoading ? "Loading..." : collegeName}
          </h1>
          <p className="text-xs text-[#8A99BB]">Student Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#8A99BB]" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-[#0F172A] border-[#334155] text-white placeholder:text-[#475569] pl-8 md:w-[200px] lg:w-[300px] focus-visible:ring-[#2dd4bf]"
          />
        </div>
        <ThemeToggle />
        <Link href="/profile">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-[#222B36]">
            <Avatar className="h-8 w-8 hover:ring-2 hover:ring-[#2dd4bf] transition-all">
              <AvatarImage
                src={user?.photoURL || ""}
                alt={user?.displayName || "User profile"}
                data-ai-hint="user avatar current profile"
              />
              <AvatarFallback className="bg-[#2dd4bf]/10 text-[#2dd4bf]">
                {user ? (
                  getInitials(user.displayName || user.email || "User")
                ) : (
                  <UserCircle className="h-6 w-6 text-[#8A99BB]" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">User profile</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
