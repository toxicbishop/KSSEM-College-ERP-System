"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getSystemSettings } from "@/services/system-settings";
import type { SystemSettings } from "@/services/system-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Users, ShieldCheck, ArrowRight } from "lucide-react";

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  studentId: z.string().min(1, { message: "Student ID is required." }),
  major: z.string().min(1, { message: "Major is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  parentEmail: z.string().email({ message: "Invalid parent's email address." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  if (typeof document !== "undefined") {
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(
    null,
  );
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSystemSettings();
        setSystemSettings(settings);
      } catch (error) {
        console.error("Failed to load system settings:", error);
        toast({
          title: "Error",
          description: "Could not load settings.",
          variant: "destructive",
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      studentId: "",
      major: "",
      email: "",
      password: "",
      parentEmail: "",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);
    if (loadingSettings) {
      toast({ title: "Please wait", description: "Loading settings..." });
      setLoading(false);
      return;
    }
    if (!systemSettings?.allowNewUserRegistration) {
      toast({
        title: "Registration Disabled",
        description: "New registration is currently disabled.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    if (!auth || !db) {
      toast({
        title: "Initialization Error",
        description: "Firebase is not configured correctly.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: data.name,
        studentId: data.studentId,
        major: data.major,
        email: data.email,
        parentEmail: data.parentEmail,
        role: "student",
      });
      const idToken = await user.getIdToken();
      setCookie("firebaseAuthToken", idToken, 1);
      toast({
        title: "Sign Up Successful",
        description: "Your account has been created.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign up error:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/email-already-in-use")
        description = "This email address is already in use.";
      else if (error.code === "auth/invalid-email")
        description = "Please enter a valid email address.";
      else if (error.code === "auth/weak-password")
        description = "The password is too weak.";
      toast({ title: "Sign Up Failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formFields: {
    name: keyof SignUpFormValues;
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    { name: "name", label: "Full Name", placeholder: "Pranav Arun" },
    { name: "studentId", label: "Student ID", placeholder: "e.g., 1KS22CS001" },
    {
      name: "major",
      label: "Major / Program",
      placeholder: "e.g., Computer Science",
    },
    { name: "email", label: "Email Address", placeholder: "you@example.com" },
    {
      name: "password",
      label: "Password",
      placeholder: "••••••••",
      type: "password",
    },
    {
      name: "parentEmail",
      label: "Parent's Email",
      placeholder: "parent@example.com",
    },
  ];

  if (loadingSettings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kssem-bg">
        <div className="w-full max-w-md p-8">
          <Skeleton className="h-8 w-1/2 mx-auto mb-4" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Form Panel */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 md:px-16 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 mb-10">
            <Image
              src="/collage-logo.png"
              alt="Logo"
              width={36}
              height={36}
              data-ai-hint="college crest"
            />
            <span className="font-serif font-bold text-kssem-navy text-xl">
              KSSEM
            </span>
          </Link>

          <h1 className="font-serif font-bold text-3xl text-kssem-navy mb-1">
            Create Your Account
          </h1>
          <p className="text-kssem-text-muted text-sm mb-8">
            Join the KSSEM academic community.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formFields.map((f) => (
                  <FormField
                    key={f.name}
                    control={form.control}
                    name={f.name}
                    render={({ field }) => (
                      <FormItem
                        className={
                          f.name === "email" || f.name === "parentEmail"
                            ? "sm:col-span-2"
                            : ""
                        }>
                        <FormLabel className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          {f.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={f.type || "text"}
                            placeholder={f.placeholder}
                            className="border-kssem-border rounded-sm focus-visible:ring-kssem-navy bg-kssem-bg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loading || !systemSettings?.allowNewUserRegistration}
                className="w-full bg-kssem-navy text-white py-3 rounded-sm font-bold uppercase tracking-wider text-sm hover:bg-kssem-navy-light transition-colors disabled:opacity-50 mt-2">
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-kssem-text-muted">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-kssem-navy font-bold hover:text-kssem-gold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Navy Hero Panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-kssem-navy flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-kssem-navy via-[#001a3a] to-[#003366]" />
        <div className="relative z-10 text-center max-w-lg">
          <GraduationCap className="h-16 w-16 text-kssem-gold mx-auto mb-6" />
          <h2 className="font-serif font-bold text-3xl text-white mb-3">
            Begin Your{" "}
            <em className="text-kssem-gold italic">Academic Journey</em>
          </h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Access your entire academic ecosystem — attendance, grades, fees,
            and more — all from one secure platform.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, label: "Secure Access" },
              { icon: Users, label: "Community" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-sm p-4 flex items-center gap-3">
                <item.icon className="h-5 w-5 text-kssem-gold shrink-0" />
                <span className="text-white text-sm font-semibold">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
