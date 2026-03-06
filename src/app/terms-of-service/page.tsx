"use client";

import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-kssem-bg">
      <PublicHeader />

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
