"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-kssem-text-muted text-sm mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <h2 className="text-xl font-serif font-bold text-kssem-navy mt-8 mb-3">
                1. Introduction
              </h2>
              <p className="text-kssem-text-muted leading-relaxed">
                Welcome to KSSEM Student ERP. We respect your privacy and are
                committed to protecting your personal data.
              </p>

              <h2 className="text-xl font-serif font-bold text-kssem-navy mt-8 mb-3">
                2. Data We Collect
              </h2>
              <p className="text-kssem-text-muted leading-relaxed">
                We may collect Identity Data, Contact Data, Technical Data,
                Usage Data, and Profile Data.
              </p>

              <h2 className="text-xl font-serif font-bold text-kssem-navy mt-8 mb-3">
                3. How We Use Your Data
              </h2>
              <p className="text-kssem-text-muted leading-relaxed">
                We will only use your personal data when the law allows us to,
                where we need to perform the contract or where it is necessary
                for our legitimate interests.
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
