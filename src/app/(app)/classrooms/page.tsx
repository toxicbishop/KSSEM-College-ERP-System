"use client";

import { MainHeader } from "@/components/layout/main-header";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { auth as clientAuth } from "@/lib/firebase/client";
import type {
  StudentClassroomEnrollmentInfo,
  ClassmateInfo,
} from "@/services/classroom";
import { fetchStudentClassrooms, fetchClassmates } from "./actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Loader2,
  Network,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatRoom } from "@/components/chat/ChatRoom";

function StudentClassroomsLoader() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<
    StudentClassroomEnrollmentInfo[]
  >([]);
  const [loadingClassrooms, setLoadingClassroomsState] = useState(true);

  const [selectedClassroomForClassmates, setSelectedClassroomForClassmates] =
    useState<StudentClassroomEnrollmentInfo | null>(null);
  const [classmates, setClassmates] = useState<ClassmateInfo[]>([]);
  const [loadingClassmatesView, setLoadingClassmatesView] = useState(false);
  const [classmatesError, setClassmatesError] = useState<string | null>(null);
  const [isClassmatesModalOpen, setIsClassmatesModalOpen] = useState(false);

  const [selectedClassroomForChat, setSelectedClassroomForChat] =
    useState<StudentClassroomEnrollmentInfo | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && clientAuth?.currentUser) {
      const isDummyUser = user.email === "pranavarun26@gmail.com";
      const fetchClassrooms = async () => {
        setLoadingClassroomsState(true);
        try {
          const idToken = await clientAuth!.currentUser!.getIdToken();
          const fetchedClassrooms = isDummyUser
            ? ([
                {
                  classroomId: "1",
                  classroomName: "Business Process Management",
                  classroomSubject: "CS&BS",
                  studentBatchInClassroom: "Batch A",
                },
                {
                  classroomId: "2",
                  classroomName: "Machine Learning Concepts",
                  classroomSubject: "AI&DS",
                  studentBatchInClassroom: "Batch A",
                },
                {
                  classroomId: "3",
                  classroomName: "Data Structures & Algos",
                  classroomSubject: "CSE",
                  studentBatchInClassroom: "Batch A",
                },
                {
                  classroomId: "4",
                  classroomName: "Power Systems",
                  classroomSubject: "EEE",
                  studentBatchInClassroom: "Batch A",
                },
                {
                  classroomId: "5",
                  classroomName: "Microprocessors",
                  classroomSubject: "ECE",
                  studentBatchInClassroom: "Batch A",
                },
                {
                  classroomId: "6",
                  classroomName: "Thermodynamics",
                  classroomSubject: "Mechanical",
                  studentBatchInClassroom: "Batch A",
                },
                {
                  classroomId: "7",
                  classroomName: "Structural Analysis",
                  classroomSubject: "Civil",
                  studentBatchInClassroom: "Batch A",
                },
              ] as any)
            : await fetchStudentClassrooms(idToken);
          setEnrolledClassrooms(fetchedClassrooms);
        } catch (err) {
          console.error("Failed to fetch student classroom data:", err);
          toast({
            title: "Loading Error",
            description:
              "Could not load your classroom information. Please try refreshing.",
            variant: "destructive",
          });
        } finally {
          setLoadingClassroomsState(false);
        }
      };
      fetchClassrooms();
    } else if (!authLoading && !user) {
      setLoadingClassroomsState(false);
    }
  }, [user, authLoading, toast]);

  const handleViewClassmates = async (
    classroom: StudentClassroomEnrollmentInfo,
  ) => {
    if (!clientAuth?.currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please sign in again.",
        variant: "destructive",
      });
      return;
    }
    setSelectedClassroomForClassmates(classroom);
    setIsClassmatesModalOpen(true);
    setLoadingClassmatesView(true);
    setClassmatesError(null);
    try {
      const idToken = await clientAuth!.currentUser!.getIdToken();
      const fetchedClassmates = await fetchClassmates(
        idToken,
        classroom.classroomId,
      );
      setClassmates(fetchedClassmates);
    } catch (err) {
      console.error("Error fetching classmates:", err);
      setClassmatesError(
        (err as Error).message ||
          "Could not load classmates for this classroom.",
      );
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to fetch classmates.",
        variant: "destructive",
      });
    } finally {
      setLoadingClassmatesView(false);
    }
  };

  const openChatModal = (classroom: StudentClassroomEnrollmentInfo) => {
    setSelectedClassroomForChat(classroom);
    setIsChatModalOpen(true);
  };

  if (loadingClassrooms || authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-sm" />
        <Skeleton className="h-28 w-full rounded-sm" />
        <Skeleton className="h-28 w-full rounded-sm" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white shadow-prestige rounded-sm p-8 text-center">
        <p className="text-kssem-text-muted">
          Please sign in to view your classrooms.
        </p>
      </div>
    );
  }

  return (
    <>
      {enrolledClassrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrolledClassrooms.map((enrollment) => (
            <div
              key={enrollment.classroomId}
              className="card-prestige group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-kssem-navy/5 text-kssem-navy p-2.5 rounded-sm group-hover:bg-kssem-navy group-hover:text-white transition-colors shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-kssem-text font-bold text-base leading-snug group-hover:text-kssem-navy transition-colors truncate">
                    {enrollment.classroomName}
                  </h3>
                  <p className="text-kssem-text-muted text-sm truncate">
                    {enrollment.classroomSubject}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-5 bg-kssem-bg rounded-sm px-3 py-2">
                <span className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                  Batch:
                </span>
                <span className="text-kssem-navy font-bold text-sm">
                  {enrollment.studentBatchInClassroom || "Whole Class"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewClassmates(enrollment)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-kssem-navy border border-kssem-border hover:border-kssem-navy hover:bg-kssem-navy hover:text-white py-2 px-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-all">
                  <Users className="h-3.5 w-3.5" /> Classmates
                </button>
                <button
                  onClick={() => openChatModal(enrollment)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-kssem-gold text-kssem-navy hover:bg-[#c4a030] py-2 px-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" /> Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-prestige rounded-sm p-12 text-center">
          <Network className="h-12 w-12 text-kssem-text-muted mx-auto mb-3" />
          <p className="text-kssem-text-muted">
            You are not currently enrolled in any classrooms.
          </p>
        </div>
      )}

      {selectedClassroomForClassmates && (
        <Dialog
          open={isClassmatesModalOpen}
          onOpenChange={(isOpen) => {
            setIsClassmatesModalOpen(isOpen);
            if (!isOpen) {
              setSelectedClassroomForClassmates(null);
              setClassmates([]);
            }
          }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-kssem-navy">
                Classmates in {selectedClassroomForClassmates.classroomName}
              </DialogTitle>
              <DialogDescription>
                Subject: {selectedClassroomForClassmates.classroomSubject}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {loadingClassmatesView && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-kssem-navy" />
                  <span>Loading classmates...</span>
                </div>
              )}
              {classmatesError && (
                <p className="text-destructive text-center">
                  {classmatesError}
                </p>
              )}
              {!loadingClassmatesView &&
                !classmatesError &&
                classmates.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-kssem-border hover:bg-kssem-bg">
                        <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Name
                        </TableHead>
                        <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Student ID
                        </TableHead>
                        <TableHead className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider">
                          Batch
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classmates.map((classmate) => (
                        <TableRow
                          key={classmate.userId}
                          className="border-kssem-border/50 hover:bg-kssem-gold-light/30 transition-colors">
                          <TableCell className="text-kssem-text font-medium text-sm">
                            {classmate.name}
                          </TableCell>
                          <TableCell className="text-kssem-text-muted text-sm">
                            {classmate.studentIdNumber}
                          </TableCell>
                          <TableCell className="text-kssem-text-muted text-sm">
                            {classmate.batch || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              {!loadingClassmatesView &&
                !classmatesError &&
                classmates.length === 0 && (
                  <p className="text-kssem-text-muted text-center">
                    No other classmates found in this classroom.
                  </p>
                )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedClassroomForChat && user && (
        <Dialog
          open={isChatModalOpen}
          onOpenChange={(isOpen) => {
            setIsChatModalOpen(isOpen);
            if (!isOpen) setSelectedClassroomForChat(null);
          }}>
          <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
            <div className="p-4 border-b border-kssem-border bg-kssem-navy text-white">
              <DialogTitle className="font-serif">
                Chat: {selectedClassroomForChat.classroomName}
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Subject: {selectedClassroomForChat.classroomSubject}
              </DialogDescription>
            </div>
            <div className="flex-grow overflow-hidden">
              <ChatRoom
                classroomId={selectedClassroomForChat.classroomId}
                currentUserId={user.uid}
                currentUserName={user.displayName || user.email || "You"}
              />
            </div>
            <DialogFooter className="p-4 border-t border-kssem-border">
              <DialogClose asChild>
                <Button variant="outline">Close Chat</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function StudentClassroomsPage() {
  return (
    <>
      <MainHeader />
      <PageHeader
        title="My Classrooms"
        description="View your enrolled academic classrooms, assigned batches, and participate in peer discussions. Connect with your faculty and class group."
        actions={
          <div className="flex items-center gap-2 bg-kssem-bg border border-kssem-border px-4 py-2 rounded-sm shadow-sm">
            <BookOpen className="h-4 w-4 text-kssem-gold" />
            <span className="text-kssem-navy text-sm font-bold tracking-wide">
              Academic Year 2026-27
            </span>
          </div>
        }
      />
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-sm" />
              <Skeleton className="h-28 w-full rounded-sm" />
            </div>
          }>
          <StudentClassroomsLoader />
        </Suspense>
      </div>
    </>
  );
}
