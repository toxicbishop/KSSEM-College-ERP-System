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
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { auth as clientAuth } from "@/lib/firebase/client";
import type { AttendanceRecord } from "@/services/attendance";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, Download } from "lucide-react";
import { fetchAttendanceRecords } from "./actions";

function AttendanceTableLoader() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && clientAuth?.currentUser) {
      const fetchRecords = async () => {
        setLoading(true);
        setError(null);
        try {
          const idToken = await clientAuth!.currentUser!.getIdToken();
          const fetchedRecords = await fetchAttendanceRecords(idToken);
          setRecords(fetchedRecords);
        } catch (err) {
          console.error("Failed to fetch attendance records:", err);
          const errorMessage =
            (err as Error).message || "An unknown error occurred.";
          if (errorMessage.includes("Admin SDK initialization failed")) {
            setError(
              "Server configuration error. Please contact the administrator.",
            );
          } else {
            setError("Could not load your attendance data. Please try again.");
          }
          toast({
            title: "Error",
            description: "Could not load your attendance data.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Please sign in to view attendance.");
    }
  }, [user, authLoading, toast]);

  const groupedRecords = useMemo(() => {
    if (records.length === 0) return {};
    const groups: { [dateKey: string]: AttendanceRecord[] } = {};
    records.forEach((record) => {
      const dateKey = record.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(record);
    });
    return groups;
  }, [records]);

  const sortedDates = useMemo(
    () =>
      Object.keys(groupedRecords).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      ),
    [groupedRecords],
  );

  if (loading || authLoading) {
    return (
      <div className="bg-white shadow-prestige rounded-sm p-6">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-prestige p-8 border-t-[3px] border-destructive rounded-sm">
        <h2 className="flex items-center gap-2 text-destructive font-serif font-bold text-xl mb-2">
          <AlertTriangle className="h-6 w-6" /> Error Loading Attendance
        </h2>
        <p className="text-kssem-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-prestige border border-kssem-border rounded-sm overflow-hidden">
      {sortedDates.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {sortedDates.map((date) => (
            <AccordionItem
              value={date}
              key={date}
              className="border-b border-kssem-border/50">
              <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-kssem-bg transition-colors">
                <span className="font-serif font-bold text-kssem-navy text-sm">
                  {format(parseISO(date), "PPP")}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-kssem-border bg-kssem-bg hover:bg-kssem-bg">
                        <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Subject/Topic
                        </TableHead>
                        <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Classroom
                        </TableHead>
                        <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Faculty
                        </TableHead>
                        <TableHead className="text-right text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedRecords[date].map((record, index) => (
                        <TableRow
                          key={`${record.date}-${record.lectureName}-${index}`}
                          className="border-kssem-border/50 hover:bg-kssem-gold-light/30 transition-colors">
                          <TableCell className="text-kssem-text font-medium text-sm">
                            {record.lectureName || "N/A"}
                          </TableCell>
                          <TableCell className="text-kssem-text-muted text-sm">
                            {record.classroomName || "N/A"}
                          </TableCell>
                          <TableCell className="text-kssem-text-muted text-sm">
                            {record.facultyName || "N/A"}
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-center text-kssem-text-muted py-8 text-sm">
          No attendance records found.
        </p>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-kssem-border pb-4">
          <div>
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-kssem-text tracking-tight">
              Attendance Records
            </h1>
            <p className="text-kssem-text-muted text-sm mt-1">
              Your day-by-day attendance summary across all subjects.
            </p>
          </div>
        </div>
        <AttendanceTableLoader />
      </div>
    </>
  );
}
