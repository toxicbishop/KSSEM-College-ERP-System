import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-provider";
import { getApplicationName } from "@/lib/cached-settings";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Suspense } from "react";

export const runtime = "nodejs";

export const viewport: Viewport = {
  themeColor: "#002147",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getApplicationName();
  const appDescription = `Access your student information and services at ${appName}.`;

  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: appDescription,
    manifest: "/pwa/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: appName,
    },
    icons: {
      icon: "/Favicon/collage-logo.png",
      apple: "/Favicon/collage-logo.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {/* GA4 component should be within body but ideally high up, Suspense wraps client components if needed */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
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
