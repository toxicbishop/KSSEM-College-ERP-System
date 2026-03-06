"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-kssem-bg">
      <PublicHeader />

      <main className="flex-1">
        <section className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-4xl flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/profile-avatar.png"
                alt="Pranav Arun"
                width={160}
                height={160}
                className="rounded-full object-cover shadow-prestige w-40 h-40 border-4 border-kssem-gold"
              />
              <h1 className="text-4xl font-serif font-bold tracking-tight text-kssem-navy lg:text-5xl">
                Pranav Arun
              </h1>
              <p className="text-xl text-kssem-text-muted">
                Full Stack Developer & AI Enthusiast
              </p>
              <div className="flex gap-3 mt-2">
                {[
                  {
                    href: "https://github.com/toxicbishop",
                    icon: Github,
                    label: "GitHub",
                  },
                  {
                    href: "https://www.linkedin.com/in/pranav-arun/",
                    icon: Linkedin,
                    label: "LinkedIn",
                  },
                  {
                    href: "https://mail.google.com/mail/?view=cm&fs=1&to=pranavarun19@gmail.com",
                    icon: Mail,
                    label: "Email",
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="border border-kssem-border rounded-sm p-2.5 text-kssem-navy hover:bg-kssem-navy hover:text-white transition-colors">
                    <s.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="w-full card-prestige">
              <h2 className="text-2xl font-serif font-bold text-kssem-navy mb-4">
                About This Project
              </h2>
              <p className="text-kssem-text-muted leading-relaxed">
                This application was built from the ground up as a portfolio
                project to showcase a modern, scalable architecture for an
                educational institution. It features role-based access control
                (Student, Faculty, Admin), real-time data synchronization with
                Firestore, and integrated AI capabilities.
              </p>
              <ul className="list-disc list-inside text-kssem-text-muted mt-4 space-y-1.5">
                <li>
                  <strong className="text-kssem-text">Frontend:</strong>{" "}
                  Next.js, React, TypeScript, Tailwind CSS, ShadCN/UI
                </li>
                <li>
                  <strong className="text-kssem-text">
                    Backend & Database:
                  </strong>{" "}
                  Firebase (Firestore, Authentication), Next.js Server Actions
                </li>
                <li>
                  <strong className="text-kssem-text">Generative AI:</strong>{" "}
                  Google Genkit with the Gemini model family
                </li>
              </ul>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
