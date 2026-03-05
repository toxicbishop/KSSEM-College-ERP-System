"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How do I reset my password?",
    answer:
      "Go to the Sign In page and click 'Forgot Password?'. You will receive an email with instructions.",
  },
  {
    question: "Where can I view my grades and attendance?",
    answer:
      "Log into your dashboard and navigate to the 'Grades' and 'Attendance' sections from the navigation menu.",
  },
  {
    question: "How do I update my personal information?",
    answer:
      "Request changes from the 'My Profile' page. All change requests must be approved by an administrator.",
  },
  {
    question: "Is the data on this platform secure?",
    answer:
      "Yes. The application uses Firebase Authentication and Firestore Security Rules for role-based access control.",
  },
  {
    question: "Who can I contact for technical support?",
    answer:
      "Please use the form on our 'Contact' page to get in touch with the developer.",
  },
  {
    question: "Can faculty members manage multiple classrooms?",
    answer:
      "Yes, faculty can create and manage multiple classrooms, take attendance, and manage grades through the Faculty Dashboard.",
  },
];

export default function FaqPage() {
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
            <Link href="/faq" className="text-white">
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
            className="mx-auto flex max-w-3xl flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-4xl font-serif font-bold tracking-tight text-kssem-navy lg:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="max-w-2xl text-lg text-kssem-text-muted">
                Find answers to the most common questions about the Student ERP
                system.
              </p>
            </div>

            <div className="w-full">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    value={`item-${index}`}
                    key={index}
                    className="border border-kssem-border rounded-sm px-5 bg-white shadow-sm hover:shadow-prestige transition-shadow">
                    <AccordionTrigger className="text-left hover:no-underline font-bold text-kssem-navy text-sm py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-kssem-text-muted text-sm pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
