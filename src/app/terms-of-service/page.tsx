"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-kssem-bg">
      <header className="sticky top-0 z-50 w-full bg-kssem-navy shadow-lg">
        <div className="container flex h-16 items-center">
          <Link href="/" className="mr-6 flex items-center gap-2">
            <Image
              src="/collage-logo.png"
              alt="Logo"
              width={36}
              height={36}
              data-ai-hint="college crest logo"
            />
            <span className="font-serif font-bold text-white text-lg">
              KSSEM
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold">
            <Link
              href="/"
              className="text-gray-300 hover:text-kssem-gold transition-colors">
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-300 hover:text-kssem-gold transition-colors">
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-kssem-gold transition-colors">
              Contact
            </Link>
            <Link
              href="/faq"
              className="text-gray-300 hover:text-kssem-gold transition-colors">
              FAQ
            </Link>
          </nav>
          <nav className="ml-auto flex items-center space-x-3">
            <Link
              href="/signin"
              className="text-gray-300 text-sm font-semibold hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-kssem-gold text-kssem-navy px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-[#c4a030] transition-colors">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl">
            <div className="card-prestige">
              <h1 className="text-4xl font-serif font-bold tracking-tight text-kssem-navy mb-6">
                Terms of Service
              </h1>
              <p className="text-kssem-text-muted text-sm mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <h2 className="text-xl font-serif font-bold text-kssem-navy mt-8 mb-3">
                1. Terms
              </h2>
              <p className="text-kssem-text-muted leading-relaxed">
                By accessing this website, you are agreeing to be bound by these
                terms of service, all applicable laws and regulations.
              </p>

              <h2 className="text-xl font-serif font-bold text-kssem-navy mt-8 mb-3">
                2. Use License
              </h2>
              <p className="text-kssem-text-muted leading-relaxed mb-3">
                Permission is granted to temporarily download one copy of the
                materials for personal, non-commercial transitory viewing only.
                Under this license you may not:
              </p>
              <ul className="list-disc list-inside text-kssem-text-muted space-y-1.5 ml-4">
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose;</li>
                <li>attempt to decompile or reverse engineer any software;</li>
                <li>remove any copyright or proprietary notations;</li>
                <li>transfer the materials to another person.</li>
              </ul>

              <h2 className="text-xl font-serif font-bold text-kssem-navy mt-8 mb-3">
                3. Limitations
              </h2>
              <p className="text-kssem-text-muted leading-relaxed">
                In no event shall KSSEM or its suppliers be liable for any
                damages arising out of the use or inability to use the materials
                on KSSEM's website.
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
