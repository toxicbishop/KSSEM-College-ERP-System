"use client";

import { MainHeader } from "@/components/layout/main-header";
import { AlertTriangle } from "lucide-react";

export default function LeaveApplicationPageRemoved() {
  return (
    <>
      <MainHeader />
      <div className="space-y-8 pt-8">
        <div className="border-b border-kssem-border pb-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-kssem-navy">
            Leave Application
          </h1>
        </div>
        <div className="bg-white shadow-prestige border-t-[3px] border-kssem-gold rounded-sm p-8 text-center max-w-lg mx-auto">
          <AlertTriangle className="h-10 w-10 text-kssem-gold mx-auto mb-4" />
          <h2 className="font-serif font-bold text-xl text-kssem-navy mb-2">
            Feature Not Available
          </h2>
          <p className="text-kssem-text-muted text-sm">
            The leave application functionality has been removed from this
            portal. Please contact the administration office for leave-related
            inquiries.
          </p>
        </div>
      </div>
    </>
  );
}
