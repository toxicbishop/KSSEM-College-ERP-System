"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSystemSettings } from "@/services/system-settings";
import type { SystemSettings } from "@/services/system-settings";
import Image from "next/image";

export default function MaintenancePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentSettings = await getSystemSettings();
        setSettings(currentSettings);
        if (!currentSettings.maintenanceMode) {
          router.replace("/");
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-kssem-bg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kssem-navy" />
        <p className="mt-4 text-lg text-kssem-text-muted">
          Loading system status...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kssem-bg p-6 text-center">
      <div className="card-prestige w-full max-w-lg text-center">
        <Image
          src="/Favicon/collage-logo.png"
          alt="Site Logo"
          width={60}
          height={60}
          className="mb-6 mx-auto"
          data-ai-hint="college crest logo"
        />
        <div className="flex items-center justify-center gap-3 mb-4">
          <ShieldAlert className="h-8 w-8 text-kssem-gold" />
          <h1 className="text-3xl font-serif font-bold text-kssem-navy">
            Under Maintenance
          </h1>
        </div>
        <p className="text-kssem-text-muted leading-relaxed mb-6">
          {settings?.applicationName ||
            "K.S School of Engineering & Management"}{" "}
          is currently undergoing scheduled maintenance. We should be back
          online shortly. Thank you for your patience!
        </p>
        <div className="border border-dashed border-kssem-border rounded-sm p-4 mb-6 bg-kssem-bg">
          <h3 className="font-bold text-kssem-navy text-sm">
            Why am I seeing this?
          </h3>
          <p className="text-sm text-kssem-text-muted mt-1">
            We are working hard to improve your experience. Access to most parts
            of the site is temporarily restricted.
          </p>
        </div>
        <button
          onClick={() => router.push("/signin")}
          className="border border-kssem-border text-kssem-navy px-6 py-2.5 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-kssem-navy hover:text-white transition-colors">
          Admin Sign In
        </button>
      </div>
      <p className="mt-8 text-xs text-kssem-text-muted">
        &copy; {new Date().getFullYear()}{" "}
        {settings?.applicationName || "K.S School of Engineering & Management"}.
        All rights reserved.
      </p>
    </div>
  );
}
