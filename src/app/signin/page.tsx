"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Wallet,
  Clock,
  Bell,
  Library,
} from "lucide-react";

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const resetPasswordSchema = z.object({
  resetEmail: z
    .string()
    .email({ message: "Please enter a valid email address." }),
});
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

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

const featureGrid = [
  { icon: LayoutDashboard, title: "Dashboard", subtitle: "Overview & Metrics" },
  { icon: GraduationCap, title: "Academics", subtitle: "Grades & Records" },
  { icon: Wallet, title: "Finance", subtitle: "Fee Management" },
  { icon: Library, title: "Library", subtitle: "Digital Access" },
  { icon: Clock, title: "Schedule", subtitle: "Timetables" },
  { icon: Bell, title: "Alerts", subtitle: "Real-time Notices" },
];

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetEmail: "",
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);

    if (!auth || !db) {
      toast({
        title: "Initialization Error",
        description:
          "Firebase Auth is not configured correctly. Please check the console and environment variables.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      setCookie("firebaseAuthToken", idToken, 1);

      let userRole = "student";
      const ADMIN_EMAIL = "admin@gmail.com";

      if (user.email === ADMIN_EMAIL) {
        userRole = "admin";
      } else {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === "admin") userRole = "admin";
          else if (userData.role === "faculty") userRole = "faculty";
        }
      }

      toast({
        title: "Sign In Successful",
        description: "Welcome back!",
      });

      if (userRole === "admin") router.push("/admin");
      else if (userRole === "faculty") router.push("/faculty");
      else router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        description = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        description = "Please enter a valid email address.";
      } else if (error.code === "auth/api-key-not-valid") {
        description = "Firebase API Key is invalid. Check your environment.";
      } else if (error.code === "auth/network-request-failed") {
        description = "Network error. Please check your internet connection.";
      }
      toast({
        title: "Sign In Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (data: ResetPasswordFormValues) => {
    if (!auth) {
      toast({
        title: "Error",
        description: "Firebase Auth not initialized.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.resetEmail);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${data.resetEmail}, a password reset link has been sent.`,
      });
      setIsResetPasswordDialogOpen(false);
      resetPasswordForm.reset();
    } catch (error: any) {
      console.error("Password reset error:", error);
      let description =
        "Could not send password reset email. Please try again.";
      if (error.code === "auth/user-not-found") {
        description = "No user found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        description = "The email address is not valid.";
      }
      toast({
        title: "Password Reset Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased overflow-hidden">
      {/* ──────────────── Left Panel: Login (40%) ──────────────── */}
      <div className="w-full md:w-[40%] bg-white flex flex-col justify-between relative z-10 shadow-prestige h-screen overflow-y-auto">
        {/* Top Branding */}
        <div className="px-8 pt-8 md:px-12 md:pt-12">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="bg-white p-1 rounded-sm flex items-center justify-center transition-transform duration-300 shadow-sm border border-gray-100 group-hover:rotate-3">
              <Image
                src="/Favicon/collage-logo.png"
                alt="KSSEM Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-kssem-navy font-bold tracking-wide text-lg leading-tight group-hover:text-kssem-gold transition-colors">
                KSSEM
              </h2>
              <p className="text-kssem-text-muted text-[10px] uppercase tracking-[0.15em] font-bold">
                K.S School of Engineering &amp; Management
              </p>
            </div>
          </Link>
        </div>

        {/* Center Form */}
        <div className="px-8 md:px-12 flex flex-col justify-center flex-grow py-10">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-kssem-navy mb-3">
                Portal Access
              </h1>
              <p className="text-kssem-text-muted text-lg">
                Secure login for students and faculty.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8">
                {/* Email Input */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="relative group">
                      <label className="block text-xs font-bold text-kssem-text-muted uppercase tracking-widest mb-1 transition-colors group-focus-within:text-kssem-navy">
                        Institutional ID or Email
                      </label>
                      <FormControl>
                        <input
                          className="block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-3 text-kssem-navy text-lg placeholder-gray-300 focus:border-kssem-gold focus:ring-0 transition-colors rounded-none focus:outline-none"
                          placeholder="e.g. 1MS18CS001"
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-kssem-gold transition-all duration-300 group-focus-within:w-full" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Input */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="relative group">
                      <label className="block text-xs font-bold text-kssem-text-muted uppercase tracking-widest mb-1 transition-colors group-focus-within:text-kssem-navy">
                        Password
                      </label>
                      <FormControl>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-3 text-kssem-navy text-lg placeholder-gray-300 focus:border-kssem-gold focus:ring-0 transition-colors rounded-none focus:outline-none"
                            placeholder="••••••••"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-kssem-text-muted hover:text-kssem-navy transition-colors"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }>
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-kssem-gold transition-all duration-300 group-focus-within:w-full" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <input
                      type="checkbox"
                      className="rounded-sm border-gray-300 text-kssem-navy focus:ring-kssem-gold w-4 h-4"
                    />
                    <span className="text-sm text-kssem-text-muted group-hover/check:text-kssem-navy transition-colors">
                      Remember device
                    </span>
                  </label>

                  <Dialog
                    open={isResetPasswordDialogOpen}
                    onOpenChange={setIsResetPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm font-semibold text-kssem-navy hover:text-kssem-gold transition-colors">
                        Forgot Password?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-serif">
                          Reset Password
                        </DialogTitle>
                        <DialogDescription>
                          Enter your email address below to receive a password
                          reset link.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...resetPasswordForm}>
                        <form
                          onSubmit={resetPasswordForm.handleSubmit(
                            handlePasswordResetRequest,
                          )}
                          className="space-y-4 py-4">
                          <FormField
                            control={resetPasswordForm.control}
                            name="resetEmail"
                            render={({ field: resetField }) => (
                              <FormItem>
                                <Label htmlFor="resetEmailDialog">
                                  Email Address
                                </Label>
                                <FormControl>
                                  <Input
                                    id="resetEmailDialog"
                                    placeholder="you@example.com"
                                    {...resetField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={loading}>
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button
                              type="submit"
                              disabled={loading}
                              className="bg-kssem-gold text-kssem-navy hover:bg-[#c4a030]">
                              {loading ? "Sending..." : "Send Reset Link"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-kssem-gold hover:bg-[#c4a030] text-kssem-navy font-bold py-4 px-6 rounded-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50">
                    <span>{loading ? "Signing In..." : "Secure Login"}</span>
                    {!loading && (
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                </div>
              </form>
            </Form>

            <div className="mt-8 text-center">
              <p className="text-kssem-text-muted text-sm">
                First time user?{" "}
                <Link
                  href="/signup"
                  className="text-kssem-navy font-bold hover:text-kssem-gold transition-colors border-b border-transparent hover:border-kssem-gold">
                  Request Access
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 md:px-12 md:pb-8 text-center md:text-left">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} KSSEM. All rights reserved.{" "}
            <br className="md:hidden" /> Powered by Institutional ERP.
          </p>
        </div>
      </div>

      {/* ──────────────── Right Panel: Hero (60%) ──────────────── */}
      <div className="hidden md:flex md:w-[60%] bg-kssem-navy relative overflow-hidden items-center justify-center">
        {/* Background overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-kssem-navy/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-kssem-navy via-transparent to-transparent opacity-90"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl px-12 text-white">
          <div className="mb-12 border-l-4 border-kssem-gold pl-6">
            <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Streamline Campus Operations <br />
              with <span className="text-kssem-gold italic">
                Integrated
              </span>{" "}
              ERP.
            </h1>
            <p className="text-gray-300 text-lg font-light tracking-wide max-w-lg">
              Experience seamless academic administration, real-time analytics,
              and a dignified digital campus environment.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            {featureGrid.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col items-start gap-3 p-4 rounded-sm hover:bg-white/5 transition-colors cursor-default">
                <feature.icon className="h-8 w-8 text-kssem-gold" />
                <div>
                  <p className="font-serif font-bold text-lg">
                    {feature.title}
                  </p>
                  <p className="text-xs text-gray-400">{feature.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
