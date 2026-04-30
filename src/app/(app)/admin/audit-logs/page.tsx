"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import {
  ClipboardList,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";
import type { AuditAction } from "@/services/audit-logs";

type AuditLog = {
  id: string;
  actorUid: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  targetType: "user";
  targetId: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  createdAt?: Timestamp;
};

const actionMeta: Record<
  AuditAction,
  { label: string; icon: typeof UserPlus; className: string }
> = {
  USER_CREATED: {
    label: "User Created",
    icon: UserPlus,
    className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  },
  USER_PROFILE_LINKED: {
    label: "Profile Linked",
    icon: UserCheck,
    className: "bg-sky-500/15 text-sky-200 border-sky-400/30",
  },
  USER_UPDATED: {
    label: "User Updated",
    icon: UserCog,
    className: "bg-amber-500/15 text-amber-100 border-amber-400/30",
  },
  USER_DELETED: {
    label: "User Deleted",
    icon: UserMinus,
    className: "bg-red-500/15 text-red-100 border-red-400/30",
  },
};

function formatTimestamp(timestamp?: Timestamp) {
  if (!timestamp) return "Pending timestamp";
  return format(timestamp.toDate(), "dd MMM yyyy, hh:mm a");
}

function formatDetails(details?: Record<string, unknown>) {
  if (!details) return "No details";

  const values = [
    details.name ? `Name: ${details.name}` : "",
    details.studentId ? `ID: ${details.studentId}` : "",
    details.role ? `Role: ${details.role}` : "",
    details.roleBefore || details.roleAfter
      ? `Role: ${details.roleBefore || "none"} -> ${details.roleAfter || "none"}`
      : "",
  ].filter(Boolean);

  return values.length ? values.join(" | ") : "No details";
}

export default function AdminAuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      setCheckingRole(false);
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      try {
        if (!db) {
          throw new Error("Firestore is not available.");
        }

        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
          setIsAdmin(true);
        } else {
          toast({
            title: "Access Denied",
            description: "You do not have permission to view audit logs.",
            variant: "destructive",
          });
          router.push("/");
        }
      } catch (error) {
        console.error("Error verifying admin access:", error);
        toast({
          title: "Error",
          description:
            (error as Error).message || "Could not verify admin access.",
          variant: "destructive",
        });
      } finally {
        setCheckingRole(false);
      }
    };

    checkAdminAccess();
  }, [authLoading, router, toast, user]);

  const fetchAuditLogs = useCallback(async () => {
    if (!db || !isAdmin) return;

    setLoadingLogs(true);
    try {
      const logsQuery = query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const snapshot = await getDocs(logsQuery);
      const fetchedLogs = snapshot.docs.map((logDoc) => ({
        id: logDoc.id,
        ...logDoc.data(),
      })) as AuditLog[];
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error Fetching Audit Logs",
        description:
          "Could not load audit logs. Check Firestore rules and indexes.",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    if (isAdmin && !authLoading && !checkingRole) {
      fetchAuditLogs();
    }
  }, [isAdmin, authLoading, checkingRole, fetchAuditLogs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return logs;

    return logs.filter((log) =>
      [
        log.action,
        log.actorEmail,
        log.actorUid,
        log.targetEmail,
        log.targetId,
        formatDetails(log.details),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
    );
  }, [logs, searchTerm]);

  if (authLoading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-lg border-[#1e293b] bg-[#111827] text-white shadow-lg">
          <CardHeader>
            <CardTitle>Loading Audit Logs...</CardTitle>
            <CardDescription className="text-[#8A99BB]">
              Checking admin permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-lg border-[#7f1d1d] bg-[#111827] text-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-300">
              <ShieldAlert className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription className="text-[#8A99BB]">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <ClipboardList className="h-8 w-8 text-[#2dd4bf]" />
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-[#8A99BB]">
            Recent admin user-management activity.
          </p>
        </div>
        <Button
          onClick={fetchAuditLogs}
          disabled={loadingLogs}
          className="bg-[#0d9488] text-white hover:bg-[#0f766e]">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loadingLogs ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card className="border-[#1e293b] bg-[#111827] text-white shadow-xl">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Activity Trail</CardTitle>
            <CardDescription className="text-[#8A99BB]">
              Showing the latest 100 audit entries.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99BB]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search logs"
              className="border-[#334155] bg-[#0F172A] pl-9 text-white placeholder:text-[#8A99BB]"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full bg-[#1e293b]" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed border-[#334155] text-center">
              <ClipboardList className="mb-3 h-10 w-10 text-[#475569]" />
              <p className="font-medium text-white">No audit logs found</p>
              <p className="mt-1 text-sm text-[#8A99BB]">
                User create, update, and delete actions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-[#1e293b]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1e293b] hover:bg-transparent">
                    <TableHead className="text-[#8A99BB]">Time</TableHead>
                    <TableHead className="text-[#8A99BB]">Action</TableHead>
                    <TableHead className="text-[#8A99BB]">Actor</TableHead>
                    <TableHead className="text-[#8A99BB]">Target</TableHead>
                    <TableHead className="min-w-64 text-[#8A99BB]">
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const meta = actionMeta[log.action];
                    const ActionIcon = meta?.icon || ClipboardList;

                    return (
                      <TableRow
                        key={log.id}
                        className="border-[#1e293b] hover:bg-white/5">
                        <TableCell className="whitespace-nowrap text-sm text-slate-200">
                          {formatTimestamp(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1.5 whitespace-nowrap ${meta?.className || "border-slate-500/30 bg-slate-500/15 text-slate-100"}`}>
                            <ActionIcon className="h-3.5 w-3.5" />
                            {meta?.label || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white">
                            {log.actorEmail || "Unknown admin"}
                          </div>
                          <div className="max-w-52 truncate text-xs text-[#8A99BB]">
                            {log.actorUid}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white">
                            {log.targetEmail || "Unknown user"}
                          </div>
                          <div className="max-w-52 truncate text-xs text-[#8A99BB]">
                            {log.targetId}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-300">
                          {formatDetails(log.details)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
