import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowDownToLine,
  TriangleAlert,
  Banknote,
  Lock,
  FlaskConical,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeeManagementPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F8] text-slate-800 font-sans">
      {/* Top Navigation */}
      <header className="bg-[#05162E] text-white py-3 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between border-b-2 border-slate-800">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="text-[#E2AC37]">
            <GraduationCap size={32} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-wide">
              KSSEM
            </span>
            <span className="text-[10px] text-slate-300 tracking-[0.2em] leading-tight">
              SCHOOL OF ENGINEERING
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-6 md:gap-10 text-sm">
          <Link
            href="#"
            className="text-slate-300 hover:text-white transition-colors pb-1">
            Dashboard
          </Link>
          <Link
            href="#"
            className="text-slate-300 hover:text-white transition-colors pb-1">
            Academics
          </Link>
          <Link
            href="#"
            className="text-white font-medium border-b-2 border-[#E2AC37] pb-1">
            Fee Management
          </Link>
          <Link
            href="#"
            className="text-slate-300 hover:text-white transition-colors pb-1">
            Library
          </Link>
        </nav>

        <div className="flex items-center gap-3 mt-4 md:mt-0 border-l border-slate-700 pl-6">
          <div className="flex flex-col items-end">
            <span className="font-medium text-sm">Alex Sterling</span>
            <span className="text-[10px] text-[#E2AC37] uppercase tracking-wider">
              Scholar ID: 2023001
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden border border-slate-600">
            <img
              src="https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex&face=smile"
              alt="Alex Sterling"
              className="w-full h-full object-cover bg-amber-100"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
          <div>
            <h1 className="text-4xl text-[#0A192F] font-serif font-bold mb-2 tracking-tight">
              Fee Management
            </h1>
            <p className="text-slate-500 text-sm">
              Secure portal for tuition, lab fees, and transaction history.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4 md:mt-0 bg-white border-slate-200 text-[#0A192F] hover:bg-slate-50 font-medium">
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Download Statement
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column: Outstanding Balance */}
          <div className="lg:col-span-4 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="h-1.5 w-full bg-[#0A192F]"></div>

            {/* Faded Background Element */}
            <div className="absolute right-0 top-10 opacity-[0.03] pointer-events-none">
              <svg
                width="180"
                height="180"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M4 10H20V22H4V10ZM2 22H22V24H2V22ZM12 1L22 6V8H2V6L12 1Z" />
              </svg>
            </div>

            <div className="p-8">
              <h2 className="text-[11px] font-bold text-slate-500 tracking-[0.15em] mb-4 uppercase">
                Total Outstanding
              </h2>

              <div className="flex items-baseline mb-4">
                <span className="text-4xl text-[#0A192F] font-serif font-bold mr-1">
                  ₹
                </span>
                <span className="text-5xl text-[#0A192F] font-serif font-bold tracking-tight">
                  45,000
                </span>
              </div>

              <div className="inline-flex items-center bg-[#FFF1E8] text-[#D05616] px-3 py-1.5 rounded text-[11px] font-bold mb-10 tracking-widest uppercase">
                <TriangleAlert className="w-3.5 h-3.5 mr-1.5 mb-0.5" />
                Due by Oct 15
              </div>

              <div className="w-full h-px bg-slate-100 mb-6"></div>

              <button className="w-full bg-[#D4AE36] hover:bg-[#c29e2f] text-slate-900 font-bold py-3.5 px-4 rounded transition-colors flex items-center justify-center mb-4">
                <Banknote className="w-5 h-5 mr-2" strokeWidth={2.5} />
                PROCEED TO PAYMENT
              </button>

              <div className="flex items-center justify-center text-[10px] text-slate-400">
                <Lock className="w-3 h-3 mr-1.5" />
                Secure 256-bit Encrypted Transaction
              </div>
            </div>
          </div>

          {/* Right Column: Fee Breakdown */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
            <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-[#0A192F] font-bold font-serif text-xl">
                Fee Breakdown
              </h2>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Fall Semester 2023
              </span>
            </div>

            <div className="flex-1">
              {/* Item 1 */}
              <div className="flex items-start md:items-center px-6 md:px-8 py-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded flex items-center justify-center text-[#0A192F] mr-4 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#0A192F] mb-0.5">
                    Tuition Fee
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    Core academic instruction and facilities
                  </p>
                </div>
                <div className="font-serif text-xl font-bold text-[#0A192F]">
                  ₹40,000
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start md:items-center px-6 md:px-8 py-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded flex items-center justify-center text-[#0A192F] mr-4 shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#0A192F] mb-0.5">
                    Laboratory Fee
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    Computer Science & Engineering Labs
                  </p>
                </div>
                <div className="font-serif text-xl font-bold text-[#0A192F]">
                  ₹3,000
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start md:items-center px-6 md:px-8 py-5 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded flex items-center justify-center text-[#0A192F] mr-4 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#0A192F] mb-0.5">
                    Library & Resources
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    Digital access and physical lending
                  </p>
                </div>
                <div className="font-serif text-xl font-bold text-[#0A192F]">
                  ₹2,000
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4 text-right border-t border-slate-100 rounded-b-lg">
              <span className="text-[11px] text-slate-500">
                Total calculated based on registered credits.
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div>
          <h2 className="text-[#0A192F] text-2xl font-serif font-bold mb-5 flex items-center">
            Transaction History
            <div className="ml-4 flex-1 h-px bg-slate-200"></div>
          </h2>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Receipt #</th>
                    <th className="px-6 py-4 font-bold">Description</th>
                    <th className="px-6 py-4 text-right font-bold w-32">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-center font-bold w-32">
                      Status
                    </th>
                    <th className="px-6 py-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Row 1 */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">Oct 01, 2023</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[13px]">
                      REC-2023-092
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      Semester 5 Tuition (Partial)
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#0A192F]">
                      ₹25,000
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center bg-[#ECFDF5] text-[#10B981] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#D1FAE5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5"></span>
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-slate-400 hover:text-[#0A192F] transition-colors p-1">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">Aug 15, 2023</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[13px]">
                      REC-2023-104
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      Late Registration Fee
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#0A192F]">
                      ₹500
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center bg-[#ECFDF5] text-[#10B981] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#D1FAE5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5"></span>
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-slate-400 hover:text-[#0A192F] transition-colors p-1">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">Sep 28, 2023</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[13px]">
                      -
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      Lab Material Fee
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#0A192F]">
                      ₹3,000
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center bg-[#FFF7ED] text-[#F97316] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#FFEDD5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mr-1.5"></span>
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="text-slate-300 transition-colors p-1"
                        disabled>
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">May 20, 2023</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[13px]">
                      REC-2023-045
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      Semester 4 Full Tuition
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#0A192F]">
                      ₹65,000
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center bg-[#ECFDF5] text-[#10B981] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#D1FAE5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5"></span>
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-slate-400 hover:text-[#0A192F] transition-colors p-1">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold bg-white rounded-b-lg">
              <span className="text-slate-400 font-normal">
                Showing 4 of 24 transactions
              </span>
              <div className="flex gap-4 tracking-wider uppercase text-slate-500">
                <button className="hover:text-[#0A192F] transition-colors disabled:opacity-50">
                  Previous
                </button>
                <button className="text-[#0A192F] transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A192F] text-slate-400 py-8 px-6 md:px-10 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-[12px] mb-4 md:mb-0 text-center md:text-left">
            <p className="mb-0.5">&copy; 2023 KSSEM. All Rights Reserved.</p>
            <p className="text-[#8A99BB] text-[10px]">
              Authorized for use by students and faculty only.
            </p>
          </div>
          <div className="flex gap-6 text-[12px]">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Support
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
