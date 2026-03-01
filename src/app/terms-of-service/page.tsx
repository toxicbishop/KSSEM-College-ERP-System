"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Footer } from "@/components/layout/footer";

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
              <p>Last updated: {new Date().toLocaleDateString()}</p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                1. Terms
              </h2>
              <p>
                By accessing this website, you are agreeing to be bound by these
                terms of service, all applicable laws and regulations, and agree
                that you are responsible for compliance with any applicable
                local laws. If you do not agree with any of these terms, you are
                prohibited from using or accessing this site. The materials
                contained in this website are protected by applicable copyright
                and trademark law.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                2. Use License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the
                materials (information or software) on KSSEM's website for
                personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul>
                <li>modify or copy the materials;</li>
                <li>
                  use the materials for any commercial purpose, or for any
                  public display (commercial or non-commercial);
                </li>
                <li>
                  attempt to decompile or reverse engineer any software
                  contained on KSSEM's website;
                </li>
                <li>
                  remove any copyright or other proprietary notations from the
                  materials; or
                </li>
                <li>
                  transfer the materials to another person or "mirror" the
                  materials on any other server.
                </li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                3. Limitations
              </h2>
              <p>
                In no event shall KSSEM or its suppliers be liable for any
                damages (including, without limitation, damages for loss of data
                or profit, or due to business interruption) arising out of the
                use or inability to use the materials on KSSEM's website, even
                if KSSEM or a KSSEM authorized representative has been notified
                orally or in writing of the possibility of such damage. Because
                some jurisdictions do not allow limitations on implied
                warranties, or limitations of liability for consequential or
                incidental damages, these limitations may not apply to you.
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
