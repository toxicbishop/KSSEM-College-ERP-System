"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db, auth as clientAuth } from "@/lib/firebase/client";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendBulkEmail } from "@/ai/flows/send-bulk-email-flow";
import { ShieldAlert, Send, Users, Loader2 } from "lucide-react";
import type { StudentProfile } from "@/services/profile";

interface UserRecipient extends Partial<StudentProfile> {
  id: string;
  email: string;
  name: string;
}

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [recipients, setRecipients] = useState<UserRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      return;
    }
    const checkAdminAccess = async () => {
      setCheckingRole(true);
      if (!db) {
        toast({ title: "Access Denied", variant: "destructive" });
        router.push("/");
        setCheckingRole(false);
        return;
      }
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
        setIsAdmin(true);
        fetchRecipients();
      } else {
        toast({ title: "Access Denied", variant: "destructive" });
        router.push("/");
      }
      setCheckingRole(false);
    };
    checkAdminAccess();
  }, [user, authLoading, router, toast]);

  const fetchRecipients = async () => {
    if (!db) return;
    setLoadingRecipients(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs
        .map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
            }) as UserRecipient,
        )
        .filter((u) => u.email); // Ensure user has an email
      setRecipients(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error Fetching Recipients", variant: "destructive" });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSendNotification = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: "Missing Content",
        description: "Subject and body are required.",
        variant: "destructive",
      });
      return;
    }
    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "There are no users to send notifications to.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const recipientEmails = recipients.map((r) => r.email);
      await sendBulkEmail({
        subject: emailSubject,
        body: emailBody,
        recipients: recipientEmails,
      });
      toast({
        title: "Emails Sent",
        description: `Notifications are being sent to ${recipients.length} users.`,
      });
      setEmailSubject("");
      setEmailBody("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Sending Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="bg-[white] border-[kssem-border] text-kssem-text">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-kssem-text">
              <Send className="h-6 w-6 text-[kssem-gold]" /> Compose Notification
            </CardTitle>
            <CardDescription className="text-[kssem-text-muted]">
              Create and send an email notification to all registered users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-subject" className="text-[kssem-text-muted]">
                Subject
              </Label>
              <Input
                id="email-subject"
                placeholder="Important Update: Exam Schedule"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                disabled={isSending}
                className="bg-transparent border-[kssem-border] text-kssem-text placeholder:text-[kssem-border] focus-visible:ring-[kssem-gold]"
              />
            </div>
            <div>
              <Label htmlFor="email-body" className="text-[kssem-text-muted]">
                Body
              </Label>
              <Textarea
                id="email-body"
                placeholder="Dear all, please find the updated exam schedule attached..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[250px] bg-transparent border-[kssem-border] text-kssem-text placeholder:text-[kssem-border] focus-visible:ring-[kssem-gold]"
                disabled={isSending}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSendNotification}
              disabled={isSending || loadingRecipients}
              className="bg-[kssem-gold] hover:bg-[[#c4a030]] text-kssem-navy font-semibold">
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSending ? "Sending..." : `Send to ${recipients.length} Users`}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card className="bg-[white] border-[kssem-border] text-kssem-text">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-kssem-text">
              <Users className="h-6 w-6 text-[kssem-gold]" /> Recipients
            </CardTitle>
            <CardDescription className="text-[kssem-text-muted]">
              This notification will be sent to all users with a registered
              email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecipients ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[kssem-border] hover:bg-white/5">
                      <TableHead className="text-[kssem-text-muted]">Name</TableHead>
                      <TableHead className="text-[kssem-text-muted]">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow
                        key={recipient.id}
                        className="border-[kssem-border] hover:bg-white/5">
                        <TableCell className="text-kssem-text">
                          {recipient.name}
                        </TableCell>
                        <TableCell className="text-[kssem-text-muted]">
                          {recipient.email}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

