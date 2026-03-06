"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, LogIn } from "lucide-react";

export function PublicHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-kssem-navy shadow-lg border-b border-white/5">
      <div className="container flex h-16 items-center px-6 mx-auto max-w-7xl">
        <Link href="/" className="mr-8 flex items-center gap-2 group">
          <div className="bg-white p-1 rounded-sm flex items-center justify-center group-hover:scale-105 transition-transform">
            <Image
              src="/collage-logo.png"
              alt="KSSEM Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-white text-lg tracking-wide leading-none">
              KSSEM
            </span>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">
              Institution
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-wide">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  isActive
                    ? "text-kssem-gold"
                    : "text-gray-300 hover:text-white transition-colors"
                }`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side Actions */}
        <nav className="ml-auto flex items-center space-x-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2 text-gray-300 text-sm font-semibold hover:text-kssem-gold transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 rounded-full h-9 w-9 p-0 border border-kssem-gold/30">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full shadow-sm"
                        />
                      ) : (
                        <UserCircle className="h-6 w-6 text-kssem-gold" />
                      )}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/signin"
                    className="text-gray-300 text-sm font-semibold hover:text-white transition-colors flex items-center gap-1.5">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-kssem-gold text-kssem-navy hover:bg-[#c4a030] h-9 px-4 font-bold text-xs uppercase tracking-widest rounded-sm transition-all shadow-md active:scale-95">
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
