"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Image
              src="/collage-logo.png"
              alt="College Logo"
              width={32}
              height={32}
              className="mr-2"
              data-ai-hint="college crest logo"
            />
            <span className="font-bold">KSSEM</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors text-muted-foreground hover:text-primary">
              Home
            </Link>
            <Link
              href="/about"
              className="transition-colors text-muted-foreground hover:text-primary">
              About
            </Link>
            <Link
              href="/contact"
              className="transition-colors text-muted-foreground hover:text-primary">
              Contact
            </Link>
            <Link
              href="/faq"
              className="transition-colors text-muted-foreground hover:text-primary">
              FAQ
            </Link>
          </nav>
          <nav className="ml-auto flex items-center space-x-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-3xl flex-col gap-6">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              Privacy Policy
            </h1>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                1. Introduction
              </h2>
              <p>
                Welcome to KSSEM Student ERP. We respect your privacy and are
                committed to protecting your personal data. This privacy policy
                will inform you about how we look after your personal data when
                you visit our website.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                2. Data We Collect
              </h2>
              <p>
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together as
                follows: Identity Data, Contact Data, Technical Data, Usage
                Data, and Profile Data.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                3. How We Use Your Data
              </h2>
              <p>
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances: Where we need to perform the contract we are
                about to enter into or have entered into with you; where it is
                necessary for our legitimate interests (or those of a third
                party) and your interests and fundamental rights do not override
                those interests; and where we need to comply with a legal
                obligation.
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
