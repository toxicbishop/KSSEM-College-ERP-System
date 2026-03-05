"use client";

import type { AttendanceRecord } from "@/services/attendance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AttendanceOverviewCardProps {
  attendanceRecords: AttendanceRecord[];
}

export function AttendanceOverviewCard({
  attendanceRecords,
}: AttendanceOverviewCardProps) {
  const recentRecords = [...attendanceRecords]
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const hasData = recentRecords.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-kssem-border">
        <h2 className="font-serif font-bold text-xl text-kssem-text">
          Recent Attendance
        </h2>
        <Link
          href="/attendance"
          className="text-kssem-navy text-sm font-bold hover:underline">
          View Full
        </Link>
      </div>
      <div className="bg-white shadow-prestige rounded-sm overflow-hidden">
        {hasData ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-kssem-border hover:bg-transparent">
                  <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                    Lecture/Subject
                  </TableHead>
                  <TableHead className="text-right text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.map((record, index) => {
                  const date = parseISO(record.date);
                  return (
                    <TableRow
                      key={`${record.date}-${record.lectureName}-${index}`}
                      className="border-kssem-border/50 hover:bg-kssem-gold-light/30 transition-colors">
                      <TableCell className="whitespace-nowrap text-kssem-text-muted text-sm">
                        {!isNaN(date.getTime())
                          ? format(date, "PP")
                          : "Invalid Date"}
                      </TableCell>
                      <TableCell className="text-kssem-text font-medium text-sm">
                        {record.lectureName || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                            record.status === "present"
                              ? "bg-status-bg-success text-status-success border-status-success/20"
                              : "bg-red-50 text-red-600 border-red-200",
                          )}>
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              record.status === "present"
                                ? "bg-status-success"
                                : "bg-red-600",
                            )}
                          />
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] items-center justify-center">
            <p className="text-center text-kssem-text-muted text-sm">
              No attendance data available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
