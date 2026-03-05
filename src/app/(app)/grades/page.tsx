"use client";

import { MainHeader } from "@/components/layout/main-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getGrades } from "@/services/grades";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import type { Grade } from "@/services/grades";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Download, Printer } from "lucide-react";

const gradeColor = (grade: string) => {
  const g = grade.toUpperCase();
  if (g === "A+" || g === "O")
    return "bg-green-50 text-green-700 border-green-100";
  if (g === "A") return "bg-green-50 text-green-700 border-green-100";
  if (g === "B+" || g === "B")
    return "bg-blue-50 text-blue-700 border-blue-100";
  if (g === "C") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-red-50 text-red-700 border-red-100";
};

function GradesTableLoader() {
  const { user, loading: authLoading } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchGrades = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedGrades = await getGrades(user.uid);
          setGrades(fetchedGrades);
        } catch (err) {
          console.error("Failed to fetch grades:", err);
          setError("Could not load grade data.");
        } finally {
          setLoading(false);
        }
      };
      fetchGrades();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Please sign in to view grades.");
    }
  }, [user, authLoading]);

  if (loading || authLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (error) {
    return <p className="text-center text-destructive py-8">{error}</p>;
  }

  return (
    <div className="bg-white shadow-prestige border border-kssem-border overflow-hidden rounded-sm">
      {grades.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-kssem-navy text-white border-b border-kssem-navy hover:bg-kssem-navy">
                <TableHead className="text-white text-xs font-bold uppercase tracking-widest">
                  Course / Subject
                </TableHead>
                <TableHead className="text-white text-xs font-bold uppercase tracking-widest text-center w-24">
                  Grade
                </TableHead>
                <TableHead className="text-white text-xs font-bold uppercase tracking-widest text-right">
                  Last Updated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow
                  key={grade.id}
                  className="border-kssem-border/50 hover:bg-kssem-gold-light/30 transition-colors">
                  <TableCell className="text-kssem-navy font-bold text-sm">
                    {grade.courseName}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center size-8 rounded-full font-bold text-xs border",
                        gradeColor(grade.grade),
                      )}>
                      {grade.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-kssem-text-muted text-xs">
                    {format(new Date(grade.updatedAt as Date), "PP p")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-kssem-text-muted py-8 text-sm">
          No grades have been recorded for you yet.
        </p>
      )}
    </div>
  );
}

export default function GradesPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-kssem-border">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-kssem-navy mb-2">
              Examination Results
            </h1>
            <p className="text-kssem-text-muted text-sm">
              Bachelor of Technology in Computer Science & Engineering
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-kssem-navy text-kssem-navy hover:bg-kssem-navy hover:text-white transition-colors text-sm font-bold uppercase tracking-wide rounded-sm group">
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              className="flex items-center justify-center size-9 border border-kssem-border text-kssem-text-muted hover:text-kssem-navy hover:border-kssem-navy transition-colors rounded-sm bg-white"
              title="Print">
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <GradesTableLoader />
        </Suspense>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-kssem-text-muted gap-4">
          <p>
            * This is a computer generated document and does not require a
            physical signature.
          </p>
          <div className="flex items-center gap-2 font-bold">
            <span>Digitally Verified by COE</span>
          </div>
        </div>
      </div>
    </>
  );
}
