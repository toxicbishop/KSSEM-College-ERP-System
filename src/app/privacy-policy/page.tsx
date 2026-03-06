"use client";

import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PrivacyPolicyPage() {
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
