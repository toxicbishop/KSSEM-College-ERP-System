"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto bg-kssem-navy py-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col text-center md:text-left">
          <p className="text-slate-400 text-xs tracking-wide">
            &copy; {new Date().getFullYear()} K.S School of Engineering &amp;
            Management. All Rights Reserved.
          </p>
          <p className="text-slate-500 text-[10px] mt-1">
            Authorized for use by students and faculty only.
          </p>
        </div>
        <div className="flex gap-6">
          <Link
            href="/privacy-policy"
            className="text-slate-400 hover:text-white text-xs font-medium transition-colors">
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="text-slate-400 hover:text-white text-xs font-medium transition-colors">
            Support
          </Link>
          <Link
            href="/terms-of-service"
            className="text-slate-400 hover:text-white text-xs font-medium transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
