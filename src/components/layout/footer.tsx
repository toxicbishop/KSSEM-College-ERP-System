"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="border-t bg-muted/20 pb-8 mt-20 pt-16 md:pb-12 md:pt-24">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="flex flex-col space-y-4 md:col-span-1">
          <div className="flex items-center">
            <Image
              src="/collage-logo.png"
              alt="College Logo"
              width={32}
              height={32}
              className="mr-2"
              data-ai-hint="college crest logo"
            />
            <span className="font-bold text-xl">KSSEM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Unified ERP for Smarter Campus Management. By the students, for the
            students.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-foreground">Navigation</h3>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          <Link
            href="/faq"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            FAQ
          </Link>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-foreground">Social Profiles</h3>
          <a
            href="https://github.com/toxicbishop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/pranav-arun/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            LinkedIn
          </a>
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-foreground">Legal</h3>
          <Link
            href="/privacy-policy"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
      <div className="container mt-12 pt-8 border-t flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} Pranav Arun. All Rights Reserved.
        </p>
      </div>
    </motion.footer>
  );
}
