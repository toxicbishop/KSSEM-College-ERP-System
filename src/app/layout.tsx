import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-provider";
import { getApplicationName } from "@/lib/cached-settings";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Suspense } from "react";

export const runtime = "nodejs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getApplicationName();
  const appDescription = `Access your student information and services at ${appName}.`;

  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: appDescription,
    icons: {
      icon: "/collage-logo.png",
      apple: "/collage-logo.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {/* GA4 component should be within body but ideally high up, Suspense wraps client components if needed */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark">
            {children}
            <Toaster />
            <Analytics /> {/* Vercel Analytics component */}
            <SpeedInsights /> {/* Vercel Speed Insights component */}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
