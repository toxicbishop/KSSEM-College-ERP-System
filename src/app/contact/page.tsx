"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Send } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  function onSubmit(data: ContactFormValues) {
    console.log(data);
    toast({
      title: "Message Sent!",
      description:
        "Thank you for reaching out. I will get back to you shortly.",
    });
    form.reset();
  }

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
            <Link href="/contact" className="text-white">
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
            className="mx-auto flex max-w-4xl flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-4xl font-serif font-bold tracking-tight text-kssem-navy lg:text-5xl">
                Get In Touch
              </h1>
              <p className="max-w-xl text-lg text-kssem-text-muted">
                Have a question or want to work together? Feel free to reach
                out.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-prestige">
                <h2 className="font-serif font-bold text-xl text-kssem-navy mb-1">
                  Send a Message
                </h2>
                <p className="text-kssem-text-muted text-sm mb-4">
                  Fill out the form and I'll get back to you.
                </p>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4">
                    {(["name", "email"] as const).map((field) => (
                      <FormField
                        key={field}
                        control={form.control}
                        name={field}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                              {field === "name" ? "Your Name" : "Your Email"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  field === "name"
                                    ? "John Doe"
                                    : "you@example.com"
                                }
                                className="border-kssem-border rounded-sm focus-visible:ring-kssem-navy"
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                            Message
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell me about your project or query..."
                              className="min-h-[120px] border-kssem-border rounded-sm focus-visible:ring-kssem-navy"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <button
                      type="submit"
                      className="w-full bg-kssem-navy text-white py-3 rounded-sm font-bold uppercase tracking-wider text-sm hover:bg-kssem-navy-light transition-colors flex items-center justify-center gap-2">
                      Send Message <Send className="h-4 w-4" />
                    </button>
                  </form>
                </Form>
              </div>

              <div className="card-prestige">
                <h2 className="font-serif font-bold text-xl text-kssem-navy mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: Mail,
                      label: "pranav.arun@example.com",
                      href: "mailto:pranav.arun@example.com",
                    },
                    {
                      icon: Linkedin,
                      label: "LinkedIn Profile",
                      href: "https://www.linkedin.com/in/pranav-arun/",
                    },
                    {
                      icon: Github,
                      label: "GitHub Profile",
                      href: "https://github.com/toxicbishop",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-kssem-gold" />
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-kssem-navy font-semibold hover:text-kssem-gold transition-colors text-sm">
                        {item.label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
