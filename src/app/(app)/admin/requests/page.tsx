"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle, XCircle, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { ProfileChangeRequest } from "@/services/profile-change-request";
import {
  getProfileChangeRequests,
  approveProfileChangeRequest,
  denyProfileChangeRequest,
} from "@/services/profile-change-request";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export default function AdminRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestForDenial, setSelectedRequestForDenial] =
    useState<ProfileChangeRequest | null>(null);
  const [denialReason, setDenialReason] = useState("");

  // -----------------------------------------------------------------------
  // Role check — still uses Firebase custom claims for the *UI gate*.
  // The actual CRUD operations are handled by the gateway + admin service,
  // which enforce their own role checks via the X-User-Id header.
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      setCheckingRole(false);
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      // Check custom claims from Firebase
      try {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims?.role === "admin") {
          userIsCurrentlyAdmin = true;
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast({
          title: "Error",
          description: "Could not verify admin role.",
          variant: "destructive",
        });
      }

      setIsAdmin(userIsCurrentlyAdmin);
      setCheckingRole(false);

      if (!userIsCurrentlyAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive",
        });
        router.push("/dashboard");
      }
    };

    checkAdminAccess();
  }, [user, authLoading, router, toast]);

  // -----------------------------------------------------------------------
  // Data fetching — now calls the gateway (no ID token needed)
  // -----------------------------------------------------------------------

  const fetchRequests = async () => {
    if (!isAdmin) return;
    setLoadingRequests(true);
    try {
      const fetchedRequests = await getProfileChangeRequests();
      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error Fetching Requests",
        description: "Could not load change requests from the server.",
        variant: "destructive",
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading && !checkingRole) {
      fetchRequests();
    }
  }, [isAdmin, authLoading, checkingRole]);

  // -----------------------------------------------------------------------
  // Approve / Deny — gateway-backed
  // -----------------------------------------------------------------------

  const handleApprove = async (request: ProfileChangeRequest) => {
    try {
      await approveProfileChangeRequest({
        requestId: request.id,
        adminNotes: `Approved by admin: ${user?.email}`,
        newValue: String(request.newValue ?? ""),
      });
      toast({
        title: "Request Approved",
        description: `Request for ${request.fieldName} has been approved.`,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Approval Failed",
        description:
          (error as Error).message || "Could not approve the request.",
        variant: "destructive",
      });
    }
  };

  const handleDeny = async () => {
    if (!selectedRequestForDenial) return;
    if (!denialReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for denial.",
        variant: "destructive",
      });
      return;
    }
    try {
      await denyProfileChangeRequest({
        requestId: selectedRequestForDenial.id,
        adminNotes: denialReason,
      });
      toast({
        title: "Request Denied",
        description: `Request for ${selectedRequestForDenial.fieldName} has been denied.`,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error denying request:", error);
      toast({
        title: "Denial Failed",
        description: (error as Error).message || "Could not deny the request.",
        variant: "destructive",
      });
    } finally {
      setSelectedRequestForDenial(null);
      setDenialReason("");
    }
  };

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  if (authLoading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const renderValue = (value: any) => {
    if (
      typeof value === "string" &&
      (value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:"))
    ) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline truncate max-w-xs inline-block">
          {value}
        </a>
      );
    }
    // Attempt to format as a date
    const parsed = new Date(String(value));
    if (!isNaN(parsed.getTime())) {
      return format(parsed, "PP p");
    }
    return String(value === undefined || value === null ? "N/A" : value);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-kssem-border text-kssem-text">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-kssem-text">
            <Edit className="h-6 w-6 text-kssem-gold" /> Profile Change Requests
          </CardTitle>
          <CardDescription className="text-kssem-text-muted">
            Review and manage student requests to change their profile
            information.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Pending Requests */}
      <Card className="bg-white border-kssem-border text-kssem-text">
        <CardHeader>
          <CardTitle className="text-kssem-text">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : requests.filter((r) => r.status === "pending").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-kssem-border hover:bg-white/5">
                  <TableHead className="text-kssem-text-muted">Student</TableHead>
                  <TableHead className="text-kssem-text-muted">Field</TableHead>
                  <TableHead className="text-kssem-text-muted">Old Value</TableHead>
                  <TableHead className="text-kssem-text-muted">New Value</TableHead>
                  <TableHead className="text-kssem-text-muted">Requested</TableHead>
                  <TableHead className="text-right text-kssem-text-muted">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
                  .filter((r) => r.status === "pending")
                  .map((req) => (
                    <TableRow
                      key={req.id}
                      className="border-kssem-border hover:bg-white/5">
                      <TableCell>
                        <div className="text-kssem-text">
                          {req.userName || req.userId}
                        </div>
                        <div className="text-xs text-kssem-text-muted">
                          {req.userEmail}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-kssem-text">
                        {req.fieldName}
                      </TableCell>
                      <TableCell className="text-kssem-text-muted">
                        {renderValue(req.oldValue)}
                      </TableCell>
                      <TableCell className="text-kssem-text">
                        {renderValue(req.newValue)}
                      </TableCell>
                      <TableCell className="text-kssem-text-muted">
                        {req.requestedAt
                          ? format(new Date(req.requestedAt), "PP p")
                          : "Invalid Date"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(req)}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Dialog
                          open={selectedRequestForDenial?.id === req.id}
                          onOpenChange={(isOpen) => {
                            if (!isOpen) setSelectedRequestForDenial(null);
                          }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => setSelectedRequestForDenial(req)}>
                              <XCircle className="h-4 w-4 mr-1" /> Deny
                            </Button>
                          </DialogTrigger>
                          {selectedRequestForDenial &&
                            selectedRequestForDenial.id === req.id && (
                              <DialogContent className="bg-white border-kssem-border text-kssem-text">
                                <DialogHeader>
                                  <DialogTitle className="text-kssem-text">
                                    Deny Change Request
                                  </DialogTitle>
                                  <DialogDescription className="text-kssem-text-muted">
                                    Provide a reason for denying the request
                                    from {selectedRequestForDenial.userName} to
                                    change their{" "}
                                    {selectedRequestForDenial.fieldName}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label
                                    htmlFor="denialReason"
                                    className="text-kssem-text-muted">
                                    Reason for Denial
                                  </Label>
                                  <Textarea
                                    id="denialReason"
                                    value={denialReason}
                                    onChange={(e) =>
                                      setDenialReason(e.target.value)
                                    }
                                    placeholder="e.g., Information mismatch, policy violation..."
                                    className="bg-transparent border-kssem-border text-kssem-text placeholder:text-kssem-text-muted"
                                  />
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button
                                      variant="outline"
                                      className="border-kssem-border text-kssem-text hover:bg-kssem-bg"
                                      onClick={() => {
                                        setSelectedRequestForDenial(null);
                                        setDenialReason("");
                                      }}>
                                      Cancel
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDeny}>
                                    Confirm Denial
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-kssem-text-muted">No pending requests.</p>
          )}
        </CardContent>
      </Card>

      {/* Resolved Requests */}
      <Card className="bg-white border-kssem-border text-kssem-text">
        <CardHeader>
          <CardTitle className="text-kssem-text">Resolved Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : requests.filter((r) => r.status !== "pending").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-kssem-border hover:bg-white/5">
                  <TableHead className="text-kssem-text-muted">Student</TableHead>
                  <TableHead className="text-kssem-text-muted">Field</TableHead>
                  <TableHead className="text-kssem-text-muted">
                    New Value (If Approved)
                  </TableHead>
                  <TableHead className="text-kssem-text-muted">Status</TableHead>
                  <TableHead className="text-kssem-text-muted">Resolved</TableHead>
                  <TableHead className="text-kssem-text-muted">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
                  .filter((r) => r.status !== "pending")
                  .map((req) => (
                    <TableRow
                      key={req.id}
                      className="border-kssem-border hover:bg-white/5">
                      <TableCell>
                        <div className="text-kssem-text">
                          {req.userName || req.userId}
                        </div>
                        <div className="text-xs text-kssem-text-muted">
                          {req.userEmail}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-kssem-text">
                        {req.fieldName}
                      </TableCell>
                      <TableCell className="text-kssem-text-muted">
                        {req.status === "approved"
                          ? renderValue(req.newValue)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            req.status === "approved"
                              ? "bg-green-500/20 text-green-400 border-0"
                              : "bg-red-500/20 text-red-400 border-0"
                          }>
                          {req.status.charAt(0).toUpperCase() +
                            req.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-kssem-text-muted">
                        {req.resolvedAt
                          ? format(new Date(req.resolvedAt), "PP p")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-kssem-text-muted">
                        {req.adminNotes || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-kssem-text-muted">
              No resolved requests found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
