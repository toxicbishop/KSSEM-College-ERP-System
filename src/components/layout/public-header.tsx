"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, LogIn, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { deleteCookie } from "@/lib/utils";

export function PublicHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-kssem-navy/95 backdrop-blur-md shadow-lg border-b border-white/10">
      <div className="container flex h-16 items-center px-6 mx-auto max-w-7xl justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-white p-1 rounded-sm flex items-center justify-center group-hover:rotate-3 transition-transform duration-300 shadow-sm">
              <Image
                src="/Favicon/collage-logo.png"
                alt="KSSEM Logo"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-white text-lg tracking-tight leading-none group-hover:text-kssem-gold transition-colors">
                KSSEM
              </span>
              <span className="text-slate-400 text-[8px] uppercase tracking-[0.1em] mt-0.5 font-bold">
                K.S School of Engineering &amp; Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-all duration-200 relative py-1 ${
                    isActive
                      ? "text-kssem-gold after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-kssem-gold"
                      : "text-slate-300 hover:text-white"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side Actions */}
        <nav className="flex items-center space-x-6">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-6">
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-kssem-gold transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Portal
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-kssem-gold transition-colors">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 group/profile">
                    <div className="text-right hidden sm:block">
                      <p className="text-white text-xs font-bold leading-tight group-hover/profile:text-kssem-gold transition-colors">
                        {user.displayName?.split(" ")[0] || "User"}
                      </p>
                      <p className="text-slate-500 text-[10px] uppercase tracking-tighter">
                        Active Session
                      </p>
                    </div>
                    <div className="rounded-full border border-kssem-gold/30 p-0.5 group-hover/profile:border-kssem-gold transition-colors bg-white/5">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <UserCircle className="h-6 w-6 text-kssem-gold" />
                      )}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href="/signin"
                    className="text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1.5">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-kssem-gold text-kssem-navy hover:bg-[#c4a030] h-9 px-6 font-bold text-[10px] uppercase tracking-[0.15em] rounded-sm transition-all shadow-lg active:scale-95 hover:-translate-y-0.5">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
