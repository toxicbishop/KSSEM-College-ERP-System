"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  Clock,
  Bell,
  GraduationCap,
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Library,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";

const featureCards = [
  {
    icon: LayoutDashboard,
    title: "Student Dashboard",
    description:
      "A central hub for your academic life, from grades to schedules.",
  },
  {
    icon: CalendarDays,
    title: "Attendance & Timetable",
    description:
      "Track your attendance and never miss a class with an integrated timetable.",
  },
  {
    icon: GraduationCap,
    title: "Examination & Results",
    description:
      "Access exam schedules, admit cards, and view your results instantly.",
  },
  {
    icon: CreditCard,
    title: "Fees & Finance",
    description:
      "Manage your fee payments and track your financial records with ease.",
  },
  {
    icon: Library,
    title: "Library & Resources",
    description:
      "Browse the library catalog and access digital learning resources.",
  },
  {
    icon: Users,
    title: "Connect & Collaborate",
    description:
      "Engage with faculty and classmates through integrated classroom directories.",
  },
];

const valuePropositions = [
  {
    icon: Clock,
    title: "24/7 Access",
    description:
      "Your academic world is always available, anytime, anywhere, on any device.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Verified Login",
    description:
      "Rest assured that your data is protected with secure, role-based access.",
  },
  {
    icon: Bell,
    title: "Real-time Communication",
    description:
      "Stay informed with instant notifications and announcements from the college.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-kssem-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kssem-navy"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-kssem-bg overflow-x-hidden">
      {/* Navy Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full bg-kssem-navy shadow-lg">
        <div className="container flex h-16 items-center">
          <Link href="/" className="mr-6 flex items-center gap-2">
            <Image
              src="/collage-logo.png"
              alt="College Logo"
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
              className="text-white transition-colors hover:text-kssem-gold">
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-300 transition-colors hover:text-kssem-gold">
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 transition-colors hover:text-kssem-gold">
              Contact
            </Link>
            <Link
              href="/faq"
              className="text-gray-300 transition-colors hover:text-kssem-gold">
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
      </motion.header>

      <main className="flex-1">
        {/* Hero Section: Navy background */}
        <section className="bg-kssem-navy text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kssem-navy via-[#001a3a] to-[#003366] opacity-80" />
          <div className="container relative py-20 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto flex max-w-[800px] flex-col items-center gap-5 text-center">
              <p className="text-kssem-gold text-sm font-bold uppercase tracking-[0.25em]">
                K.S. School of Engineering & Management
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight tracking-tight">
                Unified ERP for Smarter{" "}
                <em className="text-kssem-gold italic">Campus Management</em>
              </h1>
              <p className="max-w-[600px] text-gray-300 text-lg leading-relaxed">
                By the students, for the students. Streamlining every aspect of
                your college experience.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <Link
                  href="/signin"
                  className="bg-kssem-gold text-kssem-navy px-8 py-3 rounded-sm font-bold uppercase tracking-wider hover:bg-[#c4a030] transition-colors flex items-center gap-2 text-sm shadow-lg">
                  Login to Portal <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="border-2 border-white/30 text-white px-8 py-3 rounded-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-colors text-sm">
                  Request Access
                </Link>
              </div>
            </motion.div>
          </div>
          {/* Gold bottom border accent */}
          <div className="h-1 bg-gradient-to-r from-transparent via-kssem-gold to-transparent" />
        </section>

        {/* Features Section */}
        <section className="container py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-kssem-navy">
              Everything You Need, All in One Place
            </h2>
            <p className="text-kssem-text-muted mt-3 text-lg">
              Explore the core modules of our integrated ERP system.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}>
                <div className="card-prestige h-full group hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-kssem-navy/5 rounded-sm group-hover:bg-kssem-navy group-hover:text-white transition-colors text-kssem-navy">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-kssem-navy text-lg">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-kssem-text-muted text-sm flex-grow">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Value Propositions */}
        <section className="bg-kssem-navy py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
                Why Choose This ERP?
              </h2>
              <p className="text-gray-400 mt-3">
                Empowering education with data-driven efficiency and seamless
                access.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {valuePropositions.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}>
                  <div className="text-center p-8 bg-white/5 border border-white/10 rounded-sm h-full hover:bg-white/10 transition-colors">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-kssem-gold/20 mb-5">
                      <item.icon className="h-8 w-8 text-kssem-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
