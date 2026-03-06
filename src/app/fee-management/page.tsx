"use client";

import React from "react";
import Link from "next/link";
import { MainHeader } from "@/components/layout/main-header";
import {
  GraduationCap,
  Download,
  AlertTriangle,
  Banknote,
  Lock,
  FlaskConical,
  BookOpen,
  FileText,
} from "lucide-react";

export default function FeeManagementPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-10 pt-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-kssem-border pb-6">
          <div>
            <h1 className="text-kssem-navy text-3xl md:text-4xl font-serif font-bold leading-tight">
              Fee Management
            </h1>
            <p className="text-kssem-text-muted text-sm mt-2">
              Secure portal for tuition, lab fees, and transaction history.
            </p>
          </div>
          <button className="hidden sm:flex items-center gap-2 text-kssem-navy font-bold text-sm border border-kssem-border px-4 py-2 bg-white hover:bg-slate-50 rounded-sm transition-colors shadow-sm mt-4 md:mt-0">
            <Download className="h-4 w-4" />
            Download Statement
          </button>
        </div>

        {/* Current Dues Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Total Outstanding Card */}
          <div className="lg:col-span-1 card-prestige bg-white !border-t-kssem-navy p-8 group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <svg
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M4 10H20V22H4V10ZM2 22H22V24H2V22ZM12 1L22 6V8H2V6L12 1Z" />
              </svg>
            </div>
            <div>
              <p className="text-kssem-text-muted text-xs uppercase tracking-widest font-bold mb-2">
                Total Outstanding
              </p>
              <p className="text-kssem-navy font-serif text-5xl font-bold tracking-tight">
                ₹45,000
              </p>
              <div className="mt-4 flex items-center gap-2 text-status-pending bg-status-bg-pending/50 px-3 py-1 rounded-sm w-fit">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Due by Oct 15
                </span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button className="w-full flex items-center justify-center gap-2 bg-kssem-gold hover:bg-[#c4a030] text-kssem-navy h-12 px-6 rounded-sm font-bold text-sm uppercase tracking-wider transition-colors shadow-sm">
                <Banknote className="h-5 w-5" />
                Proceed to Payment
              </button>
              <p className="text-center text-kssem-text-muted text-xs mt-3 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Secure 256-bit Encrypted Transaction
              </p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="lg:col-span-2 card-prestige bg-white !border-t-kssem-border p-0 overflow-hidden">
            <div className="bg-kssem-bg px-6 py-4 border-b border-kssem-border flex justify-between items-center">
              <h3 className="text-kssem-navy font-serif text-xl font-bold">
                Fee Breakdown
              </h3>
              <span className="text-kssem-text-muted text-xs uppercase tracking-widest font-bold">
                Fall Semester 2023
              </span>
            </div>
            <div className="divide-y divide-kssem-border/50">
              {/* Item 1 */}
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-kssem-navy/5 p-2 rounded-sm text-kssem-navy">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-kssem-text font-bold text-base">
                        Tuition Fee
                      </h4>
                      <p className="text-kssem-text-muted text-sm">
                        Core academic instruction and facilities
                      </p>
                    </div>
                  </div>
                  <span className="text-kssem-text font-bold font-serif text-xl">
                    ₹40,000
                  </span>
                </div>
              </div>
              {/* Item 2 */}
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-kssem-navy/5 p-2 rounded-sm text-kssem-navy">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-kssem-text font-bold text-base">
                        Laboratory Fee
                      </h4>
                      <p className="text-kssem-text-muted text-sm">
                        Computer Science & Engineering Labs
                      </p>
                    </div>
                  </div>
                  <span className="text-kssem-text font-bold font-serif text-xl">
                    ₹3,000
                  </span>
                </div>
              </div>
              {/* Item 3 */}
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-kssem-navy/5 p-2 rounded-sm text-kssem-navy">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-kssem-text font-bold text-base">
                        Library & Resources
                      </h4>
                      <p className="text-kssem-text-muted text-sm">
                        Digital access and physical lending
                      </p>
                    </div>
                  </div>
                  <span className="text-kssem-text font-bold font-serif text-xl">
                    ₹2,000
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-kssem-bg px-6 py-3 border-t border-kssem-border flex justify-end">
              <span className="text-kssem-text-muted text-xs">
                Total calculated based on registered credits.
              </span>
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-kssem-navy font-serif text-2xl font-bold whitespace-nowrap">
              Transaction History
            </h3>
            <div className="h-px bg-kssem-border w-full"></div>
          </div>
          <div className="bg-white shadow-prestige border border-kssem-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-kssem-bg border-b border-kssem-border">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-kssem-text-muted w-32">
                      Date
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-kssem-text-muted w-40">
                      Receipt #
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-kssem-text-muted">
                      Description
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-kssem-text-muted text-right">
                      Amount
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-kssem-text-muted text-center w-32">
                      Status
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-kssem-text-muted w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kssem-border/50 text-sm">
                  <tr className="hover:bg-kssem-gold-light/20 transition-colors">
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Oct 01, 2023
                    </td>
                    <td className="py-4 px-6 text-kssem-text-muted font-mono text-xs">
                      REC-2023-892
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Semester 5 Tuition (Partial)
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-bold text-right">
                      ₹25,000
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-bg-success text-status-success border border-status-success/20">
                        <span className="size-1.5 rounded-full bg-status-success"></span>{" "}
                        Paid
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-kssem-navy hover:text-kssem-gold transition-colors p-1">
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-kssem-gold-light/20 transition-colors">
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Aug 15, 2023
                    </td>
                    <td className="py-4 px-6 text-kssem-text-muted font-mono text-xs">
                      REC-2023-104
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Late Registration Fee
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-bold text-right">
                      ₹500
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-bg-success text-status-success border border-status-success/20">
                        <span className="size-1.5 rounded-full bg-status-success"></span>{" "}
                        Paid
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-kssem-navy hover:text-kssem-gold transition-colors p-1">
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-kssem-gold-light/20 transition-colors bg-status-bg-pending/10">
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Sep 28, 2023
                    </td>
                    <td className="py-4 px-6 text-kssem-text-muted font-mono text-xs">
                      -
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Lab Material Fee
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-bold text-right">
                      ₹3,000
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-bg-pending text-status-pending border border-status-pending/20">
                        <span className="size-1.5 rounded-full bg-status-pending"></span>{" "}
                        Pending
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        className="text-slate-300 cursor-not-allowed p-1"
                        disabled>
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-kssem-gold-light/20 transition-colors">
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      May 20, 2023
                    </td>
                    <td className="py-4 px-6 text-kssem-text-muted font-mono text-xs">
                      REC-2023-045
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-medium">
                      Semester 4 Full Tuition
                    </td>
                    <td className="py-4 px-6 text-kssem-text font-bold text-right">
                      ₹65,000
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-bg-success text-status-success border border-status-success/20">
                        <span className="size-1.5 rounded-full bg-status-success"></span>{" "}
                        Paid
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-kssem-navy hover:text-kssem-gold transition-colors p-1">
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-kssem-bg px-6 py-4 border-t border-kssem-border flex justify-between items-center">
              <span className="text-kssem-text-muted text-xs font-medium">
                Showing 4 of 24 transactions
              </span>
              <div className="flex gap-2">
                <button
                  className="text-kssem-navy hover:bg-white border border-transparent hover:border-kssem-border px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  disabled>
                  Previous
                </button>
                <button className="text-kssem-navy hover:bg-white border border-transparent hover:border-kssem-border px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-all">
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
