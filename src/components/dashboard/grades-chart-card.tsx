"use client";

import type { Grade } from "@/services/grades";
import { ArrowUp, ArrowDown, Lightbulb } from "lucide-react";
import type { GradeAnalysisOutput } from "@/services/grades";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface GradesChartCardProps {
  grades: Grade[];
  analysis: GradeAnalysisOutput;
}

export function GradesChartCard({ grades, analysis }: GradesChartCardProps) {
  const hasData = grades.length > 0;
  const hasRealAnalysis =
    analysis.strengths.length > 0 || analysis.areasForImprovement.length > 0;
  const getTime = (d: any) =>
    d instanceof Date
      ? d.getTime()
      : (d?.toMillis?.() ?? new Date(d).getTime());
  const recentGrades = [...grades]
    .sort((a, b) => getTime(b.updatedAt) - getTime(a.updatedAt))
    .slice(0, 5);

  // Grade to color mapping
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-kssem-border">
        <h2 className="font-serif font-bold text-xl text-kssem-text">
          Academic Performance
        </h2>
      </div>

      <div className="bg-white shadow-prestige rounded-sm p-6">
        {hasData ? (
          <div className="space-y-6">
            {/* AI Analysis Section */}
            {hasRealAnalysis ? (
              <div className="space-y-4 pb-4 border-b border-kssem-border">
                <div>
                  <h3 className="font-semibold text-kssem-text flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-kssem-gold" /> AI Summary
                  </h3>
                  <p className="text-sm text-kssem-text-muted mt-1">
                    {analysis.overallSummary}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-kssem-text flex items-center gap-2 text-sm">
                      <ArrowUp className="h-4 w-4 text-emerald-500" /> Strengths
                    </h3>
                    <ul className="list-disc list-inside text-sm text-kssem-text-muted mt-1 space-y-1">
                      {analysis.strengths.map((s, i) => (
                        <li key={`strength-${i}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-kssem-text flex items-center gap-2 text-sm">
                      <ArrowDown className="h-4 w-4 text-red-500" /> To Improve
                    </h3>
                    <ul className="list-disc list-inside text-sm text-kssem-text-muted mt-1 space-y-1">
                      {analysis.areasForImprovement.map((a, i) => (
                        <li key={`improvement-${i}`}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-sm border border-kssem-border bg-kssem-bg p-4">
                <p className="text-center text-sm text-kssem-text-muted">
                  {analysis.overallSummary}
                </p>
              </div>
            )}

            {/* Recent Grades Table */}
            <div>
              <h3 className="font-semibold text-kssem-text mb-2 text-sm">
                Recent Grades
              </h3>
              <div className="overflow-hidden border border-kssem-border rounded-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-kssem-border hover:bg-transparent bg-kssem-bg">
                      <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                        Subject
                      </TableHead>
                      <TableHead className="text-right text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                        Grade
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGrades.map((grade) => (
                      <TableRow
                        key={grade.id}
                        className="border-kssem-border/50 hover:bg-kssem-gold-light/30 transition-colors">
                        <TableCell className="py-2 text-kssem-text font-medium text-sm">
                          {grade.courseName}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center size-8 rounded-full font-bold text-xs border",
                              gradeColor(grade.grade),
                            )}>
                            {grade.grade}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] items-center justify-center">
            <p className="text-center text-kssem-text-muted text-sm">
              {analysis.overallSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
