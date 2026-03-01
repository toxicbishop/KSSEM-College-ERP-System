"use client"; // Required for Recharts

import type { Grade } from "@/types/grades";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import type { GradeAnalysisOutput } from "@/types/grade-analysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface GradesChartCardProps {
  grades: Grade[];
  analysis: GradeAnalysisOutput;
}

export function GradesChartCard({ grades, analysis }: GradesChartCardProps) {
  const hasData = grades.length > 0;
  // Check if the analysis is the default fallback or a real one
  const hasRealAnalysis =
    analysis.strengths.length > 0 || analysis.areasForImprovement.length > 0;
  const getTime = (d: any) =>
    d instanceof Date
      ? d.getTime()
      : (d?.toMillis?.() ?? new Date(d).getTime());
  const recentGrades = [...grades]
    .sort((a, b) => getTime(b.updatedAt) - getTime(a.updatedAt))
    .slice(0, 5);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow bg-[#222B36] border-[#2a3441] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <GraduationCap className="h-5 w-5 text-[#2dd4bf]" />
          Grade Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasData ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* AI Analysis Section - Conditionally render based on hasRealAnalysis */}
            {hasRealAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" /> AI Summary
                  </h3>
                  <p className="text-sm text-[#8A99BB] mt-1">
                    {analysis.overallSummary}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-green-400" /> Strengths
                  </h3>
                  <ul className="list-disc list-inside text-sm text-[#8A99BB] mt-1 space-y-1">
                    {analysis.strengths.length > 0 ? (
                      analysis.strengths.map((s, i) => (
                        <li key={`strength-${i}`}>{s}</li>
                      ))
                    ) : (
                      <li>No specific strengths identified yet.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-red-400" /> Areas for
                    Improvement
                  </h3>
                  <ul className="list-disc list-inside text-sm text-[#8A99BB] mt-1 space-y-1">
                    {analysis.areasForImprovement.length > 0 ? (
                      analysis.areasForImprovement.map((a, i) => (
                        <li key={`improvement-${i}`}>{a}</li>
                      ))
                    ) : (
                      <li>
                        Great work! No specific areas for improvement noted.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border border-[#334155] bg-[#1A222C] p-4">
                <p className="text-center text-sm text-[#8A99BB]">
                  {analysis.overallSummary}
                </p>
              </div>
            )}

            {/* Recent Grades Table */}
            <div>
              <h3 className="font-semibold text-white mb-2">Recent Grades</h3>
              <div className="overflow-hidden rounded-md border border-[#334155]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#334155] hover:bg-white/5">
                      <TableHead className="text-[#8A99BB]">Subject</TableHead>
                      <TableHead className="text-right text-[#8A99BB]">
                        Grade
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGrades.map((grade) => (
                      <TableRow
                        key={grade.id}
                        className="border-[#334155] hover:bg-white/5">
                        <TableCell className="py-2 text-white">
                          {grade.courseName}
                        </TableCell>
                        <TableCell className="text-right font-medium py-2 text-[#2dd4bf]">
                          {grade.grade}
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
            <p className="text-center text-[#8A99BB]">
              {analysis.overallSummary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
