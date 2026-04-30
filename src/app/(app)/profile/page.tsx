"use client";

import { MainHeader } from "@/components/layout/main-header";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, Suspense, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { auth as clientAuth } from "@/lib/firebase/client";
import type { StudentProfile } from "@/services/profile";
import { getStudentProfile, updateStudentProfile } from "@/services/profile";
import { createProfileChangeRequest } from "@/services/profile-change-request";
import type {
  StudentClassroomEnrollmentInfo,
  ClassmateInfo,
} from "@/services/classroom";
import { fetchStudentClassrooms, fetchClassmates } from "../classrooms/actions";
import Image from "next/image";
import sanitizeHtml from 'sanitize-html';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Eye,
  UserSquare,
  BookOpen,
  FileText,
  FileImage,
  ClipboardList,
  Edit3,
  Send,
  Edit2,
  Save,
  Users,
  Loader2,
  AlertTriangle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to safely validate URLs before using them in href/src attributes to prevent XSS
const isSafeUrl = (url?: string | null): boolean => {
  if (!url) return false;

  const trimmed = url.trim();

  // Allow absolute URLs with safe protocols
  if (/^(https?|mailto|tel):/i.test(trimmed)) {
    return true;
  }

  // Allow relative URLs starting with / (but not // which is protocol-relative)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  return false;
};

// Helper to sanitize any user-provided text for safe insertion into the DOM
const sanitizeForText = (input?: string | null): string => {
  if (!input) return "";
  // Use a well-tested sanitizer to remove all markup and attributes, returning
  // plain text. This avoids regex-based multi-character reconstruction issues.
  const cleaned = sanitizeHtml(String(input), {
    allowedTags: [],
    allowedAttributes: {},
    // Do not allow any HTML; return only text.
  });
  return cleaned.trim();
};
// Helper function to get initials from a name
const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

// Helper component moved outside ProfileDetailsLoader to prevent re-creation on render
const InfoItem = ({
  label,
  value,
  fieldName,
  isEditable,
  isEditMode,
  onEditRequest,
  editModeRender,
  handleInputChange,
  editableProfileValue,
  profileValue,
}: {
  label: string;
  value?: string | number | null;
  fieldName: keyof StudentProfile;
  isEditable?: boolean;
  isEditMode: boolean;
  onEditRequest?: (fieldName: keyof StudentProfile, label: string) => void;
  editModeRender?: (
    currentValue: any,
    handleChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => void,
    fieldName: keyof StudentProfile,
  ) => JSX.Element;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  editableProfileValue: any;
  profileValue: any;
}) => (
  <div className="mb-2">
    <Label
      htmlFor={fieldName}
      className="font-semibold text-kssem-text-muted text-xs uppercase tracking-wider">
      {label}:
    </Label>
    {isEditMode && isEditable ? (
      editModeRender ? (
        editModeRender(editableProfileValue, handleInputChange, fieldName)
      ) : (
        <Input
          id={fieldName}
          name={fieldName}
          className="mt-1"
          value={String(editableProfileValue ?? "")}
          onChange={handleInputChange}
          type={
            typeof profileValue === "number"
              ? "number"
              : fieldName.toLocaleLowerCase().includes("phone") ||
                  fieldName.toLocaleLowerCase().includes("number")
                ? "tel"
                : "text"
          }
          pattern={
            fieldName.toLocaleLowerCase().includes("name")
              ? "^[a-zA-Z\\s]{2,50}$"
              : fieldName.toLocaleLowerCase().includes("phone") ||
                  fieldName.toLocaleLowerCase().includes("number")
                ? "^\\+?[\\d\\s-]{10,15}$"
                : undefined
          }
          title={
            fieldName.toLocaleLowerCase().includes("name")
              ? "Alphabetical characters and spaces only (2-50 characters)"
              : fieldName.toLocaleLowerCase().includes("phone") ||
                  fieldName.toLocaleLowerCase().includes("number")
                ? "Valid phone number (e.g. +1234567890)"
                : undefined
          }
        />
      )
    ) : isEditMode && onEditRequest ? (
      <div className="flex items-center gap-2 mt-1 light">
        <span className="text-kssem-text break-all">{value || "N/A"}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditRequest(fieldName, label)}
          className="whitespace-nowrap bg-kssem-gold text-kssem-navy border-kssem-gold hover:bg-[#c4a030] transition-all shadow-md font-bold uppercase tracking-wider text-[10px]">
          <Send className="mr-2 h-3 w-3" /> Request Change
        </Button>
      </div>
    ) : (
      <span className="ml-2 text-kssem-text break-all font-medium transition-colors hover:text-kssem-navy hover:underline cursor-default">
        {value || "N/A"}
      </span>
    )}
  </div>
);

// Helper component moved outside ProfileDetailsLoader to prevent re-creation on render
const DocumentOrActionItem = ({
  label,
  url,
  actionLabel,
  icon,
  isDownloadable = false,
  actionType = "link",
}: {
  label: string;
  url?: string;
  fieldName: keyof StudentProfile;
  actionLabel?: string;
  icon?: React.ElementType;
  isDownloadable?: boolean;
  actionType?: "link" | "button";
  revalRef?: React.RefObject<HTMLInputElement>;
}) => {
  const IconComponent = icon;
  const trimmedUrl = url?.trim();
  const safeUrl = trimmedUrl && isSafeUrl(trimmedUrl) ? trimmedUrl : undefined;
  const safeLabel = sanitizeForText(label);
  const safeActionLabel = sanitizeForText(
    actionLabel || (isDownloadable ? "Download" : "View"),
  );

  return (
    <div className="mb-3 flex flex-col items-start gap-2 rounded-sm border border-kssem-border p-3 text-kssem-text sm:flex-row sm:items-center sm:justify-between hover:bg-kssem-bg transition-colors">
      <div className="flex items-center">
        {IconComponent && (
          <IconComponent className="mr-2 h-4 w-4 text-kssem-navy" />
        )}
        <span className="text-sm font-medium text-kssem-text">{safeLabel}</span>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {safeUrl ? (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full sm:w-auto bg-white border-kssem-border text-kssem-navy hover:bg-kssem-navy hover:text-white transition-all shadow-sm">
            <a
              href={safeUrl}
              download={isDownloadable}
              target="_blank"
              rel="noopener noreferrer">
              {isDownloadable ? (
                <Download className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              <span className="ml-1">{safeActionLabel}</span>
            </a>
          </Button>
        ) : actionType === "button" && actionLabel ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto bg-white border-kssem-border text-kssem-navy hover:bg-kssem-navy hover:text-white transition-all shadow-sm">
            {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
            <span className="ml-1">{safeActionLabel}</span>
          </Button>
        ) : (
          <span className="text-sm text-kssem-text-muted">
            {safeActionLabel || "Not Available"}
          </span>
        )}
      </div>
    </div>
  );
};

function ProfileDetailsLoader() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<
    Partial<StudentProfile>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin users can directly edit all fields without requesting changes
  const isAdmin = profile?.role === "admin";

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFieldInfo, setRequestFieldInfo] = useState<{
    key: keyof StudentProfile;
    label: string;
  } | null>(null);
  const [requestOldValue, setRequestOldValue] = useState("");
  const [requestNewValue, setRequestNewValue] = useState("");

  const revalRef = useRef<HTMLInputElement>(null);

  const [enrolledClassrooms, setEnrolledClassrooms] = useState<
    StudentClassroomEnrollmentInfo[]
  >([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [classroomsError, setClassroomsError] = useState<string | null>(null);

  // State for View Classmates Modal
  const [selectedClassroomForClassmates, setSelectedClassroomForClassmates] =
    useState<StudentClassroomEnrollmentInfo | null>(null);
  const [classmates, setClassmates] = useState<ClassmateInfo[]>([]);
  const [loadingClassmates, setLoadingClassmatesView] = useState(false); // Renamed to avoid conflict
  const [fetchClassmatesError, setFetchClassmatesError] = useState<
    string | null
  >(null);
  const [isClassmatesModalOpen, setIsClassmatesModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && clientAuth && clientAuth.currentUser) {
      const fetchProfileAndClassrooms = async () => {
        setLoading(true);
        setLoadingClassrooms(true);
        setError(null);
        setClassroomsError(null);

        try {
          const idToken = await clientAuth!.currentUser!.getIdToken();
          const fetchedProfile = await getStudentProfile(idToken);
          if (fetchedProfile) {
            const enrichedProfile = {
              ...fetchedProfile,
              email: fetchedProfile.email || user.email || "N/A",
            };
            setProfile(enrichedProfile);
            setEditableProfile(enrichedProfile);
          } else {
            setProfile(null);
          }

          // Fetch classrooms separately and handle its error state independently
          try {
            const fetchedClassrooms = await fetchStudentClassrooms(idToken);
            setEnrolledClassrooms(fetchedClassrooms);
          } catch (classroomErr) {
            const errorMessage =
              (classroomErr as Error).message ||
              "An unknown error occurred fetching classrooms.";
            if (errorMessage.includes("Admin SDK initialization failed")) {
              setClassroomsError(
                "Could not load classroom data because the server is not configured correctly. Please contact an administrator.",
              );
            } else {
              setClassroomsError("Could not load your classroom information.");
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile or classroom data:", err);
          setError("Could not load your main profile data.");
          toast({
            title: "Loading Error",
            description:
              "Could not load all your information. Please try refreshing.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
          setLoadingClassrooms(false);
        }
      };
      fetchProfileAndClassrooms();
    } else if (!authLoading && !user) {
      setLoading(false);
      setLoadingClassrooms(false);
      setError("Please sign in to view your profile.");
    }
  }, [user, authLoading, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const numericFields = ["currentYear", "currentSemester"];
    setEditableProfile((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? value === ""
          ? undefined
          : Number(value)
        : value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile || !user || !clientAuth || !clientAuth.currentUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await updateStudentProfile(idToken, editableProfile);
      // Optimistically update the main profile state
      setProfile((prev) => (prev ? { ...prev, ...editableProfile } : null));
      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: (error as Error).message || "Could not save your changes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRequestModal = (fieldName: keyof StudentProfile, label: string) => {
    if (!profile || !user) return;
    setRequestFieldInfo({ key: fieldName, label });
    setRequestOldValue(String(profile[fieldName] ?? "N/A"));
    setRequestNewValue(String(profile[fieldName] ?? ""));
    setIsRequestModalOpen(true);
  };

  const handleSubmitChangeRequest = async () => {
    if (
      !user ||
      !profile ||
      !requestFieldInfo ||
      !clientAuth ||
      !clientAuth.currentUser
    ) {
      toast({
        title: "Error",
        description:
          "User not authenticated or profile data missing for request.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Submitting Request...",
      description: `Requesting to change ${requestFieldInfo.label}.`,
    });
    try {
      const idToken = await clientAuth!.currentUser!.getIdToken(); // Force refresh token
      await createProfileChangeRequest(
        idToken,
        requestFieldInfo.key,
        requestOldValue,
        requestNewValue,
      );
      toast({
        title: "Request Submitted",
        description: `Your request to change ${requestFieldInfo.label} has been submitted for admin approval.`,
      });
    } catch (error) {
      console.error(
        "Error submitting change request (via Server Action):",
        error,
      );
      toast({
        title: "Submission Failed",
        description:
          (error as Error).message ||
          "Could not submit your change request. Please try again.",
        variant: "destructive",
      });
    }
    setIsRequestModalOpen(false);
    setRequestNewValue("");
    setRequestFieldInfo(null);
  };

  const handleViewClassmates = async (
    classroom: StudentClassroomEnrollmentInfo,
  ) => {
    if (!clientAuth || !clientAuth.currentUser) {
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
    setFetchClassmatesError(null);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const fetchedClassmates = await fetchClassmates(
        idToken,
        classroom.classroomId,
      );
      setClassmates(fetchedClassmates);
    } catch (err) {
      console.error("Error fetching classmates:", err);
      setFetchClassmatesError(
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

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />{" "}
        {/* For classrooms card */}
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-400">{error}</p>;
  }

  if (!profile) {
    return (
      <p className="text-center text-kssem-text-muted">
        Profile not available.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isEditMode ? (
          <Button
            onClick={handleSaveProfile}
            disabled={isSubmitting}
            className="bg-kssem-gold text-kssem-navy hover:bg-kssem-gold/90">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Profile
          </Button>
        ) : (
          <Button onClick={() => setIsEditMode(true)}>
            <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <Card className="card-prestige !bg-white text-kssem-text light">
        <CardHeader className="border-b border-kssem-border">
          <CardTitle className="flex items-center text-xl font-serif text-kssem-navy">
            <UserSquare className="mr-3 h-6 w-6 text-kssem-gold" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1 flex flex-col items-center">
            <Avatar className="h-[150px] w-[150px] shadow-md mb-4 text-4xl">
              <AvatarImage
                src={
                  (isEditMode &&
                  typeof editableProfile.profilePhotoUrl === "string"
                    ? editableProfile.profilePhotoUrl
                    : profile.profilePhotoUrl) || ""
                }
                alt={profile.name || "Profile Photo"}
                className="object-cover"
                data-ai-hint="profile photo"
              />
              <AvatarFallback className="bg-kssem-gold/10 text-kssem-gold">
                {getInitials(profile.name || profile.email || "User")}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold text-kssem-text font-serif">
              {profile.name}
            </h3>
            <p className="text-sm text-kssem-text-muted break-all">
              {profile.email}
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <InfoItem
              label="Full Name"
              value={profile.name}
              fieldName="name"
              isEditable={
                !profile.name ||
                profile.name === "N/A" ||
                isAdmin ||
                user?.email === "pranavarun26@gmail.com"
              } // Allow yours to fill their name
              onEditRequest={
                profile.name &&
                profile.name !== "N/A" &&
                !isAdmin &&
                user?.email !== "pranavarun26@gmail.com"
                  ? openRequestModal
                  : undefined
              }
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.name}
              profileValue={profile.name}
            />
            <InfoItem
              label="Date of Birth"
              value={profile.dateOfBirth}
              fieldName="dateOfBirth"
              isEditable={true}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.dateOfBirth}
              profileValue={profile.dateOfBirth}
              editModeRender={(currentValue, handleChange, name) => (
                <Input
                  id={name as string}
                  name={name as string}
                  type="date"
                  className="mt-1"
                  value={currentValue || ""}
                  onChange={handleChange}
                />
              )}
            />
            <InfoItem
              label="Gender"
              value={profile.gender}
              fieldName="gender"
              isEditable={true}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.gender}
              profileValue={profile.gender}
              editModeRender={(currentValue, handleChange, name) => (
                <select
                  id={name as string}
                  name={name as string}
                  value={currentValue || ""}
                  onChange={handleChange}
                  className="input-class mt-1 block w-full rounded-sm border-kssem-border bg-kssem-bg p-2 text-sm shadow-sm focus:border-kssem-navy focus:ring focus:ring-kssem-navy focus:ring-opacity-50 h-10">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              )}
            />
            <InfoItem
              label="Contact Number"
              value={profile.contactNumber}
              fieldName="contactNumber"
              isEditable={true}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.contactNumber}
              profileValue={profile.contactNumber}
              editModeRender={(currentValue, handleChange, name) => (
                <Input
                  id={name as string}
                  name={name as string}
                  type="tel"
                  className="mt-1"
                  value={currentValue || ""}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  pattern="^\+?[\d\s-]{10,15}$"
                  title="Valid phone number (e.g. +1234567890)"
                />
              )}
            />
            <InfoItem
              label="Email Address"
              value={profile.email}
              fieldName="email"
              isEditable={!profile.email || profile.email === "N/A" || isAdmin} // Allow filling if empty
              onEditRequest={
                profile.email && profile.email !== "N/A" && !isAdmin
                  ? openRequestModal
                  : undefined
              }
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.email}
              profileValue={profile.email}
            />
            <div className="sm:col-span-2">
              <InfoItem
                label="Permanent Address"
                value={profile.permanentAddress}
                fieldName="permanentAddress"
                isEditable={true}
                isEditMode={isEditMode}
                handleInputChange={handleInputChange}
                editableProfileValue={editableProfile.permanentAddress}
                profileValue={profile.permanentAddress}
                editModeRender={(currentValue, handleChange, name) => (
                  <Textarea
                    id={name as string}
                    name={name as string}
                    className="mt-1"
                    value={currentValue || ""}
                    onChange={handleChange}
                    placeholder="123 Main St, City, Country"
                  />
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <InfoItem
                label="Current Address"
                value={profile.currentAddress}
                fieldName="currentAddress"
                isEditable={true}
                isEditMode={isEditMode}
                handleInputChange={handleInputChange}
                editableProfileValue={editableProfile.currentAddress}
                profileValue={profile.currentAddress}
                editModeRender={(currentValue, handleChange, name) => (
                  <Textarea
                    id={name as string}
                    name={name as string}
                    className="mt-1"
                    value={currentValue || ""}
                    onChange={handleChange}
                    placeholder="Apt 4B, Complex, City"
                  />
                )}
              />
            </div>
            <InfoItem
              label="Blood Group"
              value={profile.bloodGroup}
              fieldName="bloodGroup"
              isEditable={true}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.bloodGroup}
              profileValue={profile.bloodGroup}
              editModeRender={(currentValue, handleChange, name) => (
                <select
                  id={name as string}
                  name={name as string}
                  value={currentValue || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-sm border-kssem-border bg-slate-50/50 p-2 text-sm h-10">
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              )}
            />
            <InfoItem
              label="Emergency Contact Name"
              value={profile.emergencyContactName}
              fieldName="emergencyContactName"
              isEditable={true}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.emergencyContactName}
              profileValue={profile.emergencyContactName}
              editModeRender={(currentValue, handleChange, name) => (
                <Input
                  id={name as string}
                  name={name as string}
                  className="mt-1"
                  value={currentValue || ""}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  pattern="^[a-zA-Z\s]{2,50}$"
                  title="Alphabetical characters and spaces only (2-50 characters)"
                />
              )}
            />
            <InfoItem
              label="Emergency Contact Number"
              value={profile.emergencyContactNumber}
              fieldName="emergencyContactNumber"
              isEditable={true}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              editableProfileValue={editableProfile.emergencyContactNumber}
              profileValue={profile.emergencyContactNumber}
              editModeRender={(currentValue, handleChange, name) => (
                <Input
                  id={name as string}
                  name={name as string}
                  type="tel"
                  className="mt-1"
                  value={currentValue || ""}
                  onChange={handleChange}
                  placeholder="+0987654321"
                  pattern="^\+?[\d\s-]{10,15}$"
                  title="Valid phone number (e.g. +1234567890)"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-prestige !bg-white text-kssem-text light">
        <CardHeader className="border-b border-kssem-border">
          <CardTitle className="flex items-center text-xl font-serif text-kssem-navy">
            <Users className="mr-3 h-6 w-6 text-kssem-gold" />
            My Classrooms & Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClassrooms ? (
            <Skeleton className="h-20 w-full" />
          ) : classroomsError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{classroomsError}</p>
            </div>
          ) : enrolledClassrooms.length > 0 ? (
            <ul className="space-y-3">
              {enrolledClassrooms.map((enrollment) => (
                <li
                  key={enrollment.classroomId}
                  className="rounded-sm border border-kssem-border p-4 text-kssem-text hover:bg-kssem-bg transition-colors">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-semibold">
                        {enrollment.classroomName}
                      </h4>
                      <p className="text-sm text-kssem-text-muted">
                        Subject: {enrollment.classroomSubject}
                      </p>
                      <p className="text-sm text-kssem-text-muted">
                        Your Batch:{" "}
                        <span className="font-medium text-kssem-navy">
                          {enrollment.studentBatchInClassroom ||
                            "N/A (Whole Class)"}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewClassmates(enrollment)}
                      className="bg-white border-kssem-border text-kssem-navy hover:bg-kssem-navy hover:text-white transition-all shadow-sm">
                      <Users className="mr-2 h-4 w-4" /> View Classmates
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-kssem-text-muted">
              You are not currently enrolled in any classrooms.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-prestige bg-white border border-kssem-border text-kssem-text rounded-sm light">
        <CardHeader className="border-b border-kssem-border">
          <CardTitle className="flex items-center text-xl font-serif text-kssem-navy">
            <BookOpen className="mr-3 h-6 w-6 text-kssem-gold" />
            Academic Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          <InfoItem
            label="USN (University Seat Number)"
            value={profile.enrollmentNumber}
            fieldName="enrollmentNumber"
            isEditable={false} // USN is fixed by university
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.enrollmentNumber}
            profileValue={profile.enrollmentNumber}
          />
          <InfoItem
            label="Course / Program"
            value={profile.courseProgram}
            fieldName="courseProgram"
            isEditable={isAdmin}
            onEditRequest={isAdmin ? undefined : openRequestModal}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.courseProgram}
            profileValue={profile.courseProgram}
          />
          <InfoItem
            label="Department"
            value={profile.department}
            fieldName="department"
            isEditable={isAdmin}
            onEditRequest={isAdmin ? undefined : openRequestModal}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.department}
            profileValue={profile.department}
          />
          <InfoItem
            label="Current Year"
            value={profile.currentYear ? `Year ${profile.currentYear}` : "N/A"}
            fieldName="currentYear"
            isEditable={isAdmin}
            onEditRequest={isAdmin ? undefined : openRequestModal}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.currentYear}
            profileValue={profile.currentYear}
          />
          <InfoItem
            label="Current Semester"
            value={
              profile.currentSemester
                ? `Semester ${profile.currentSemester}`
                : "N/A"
            }
            fieldName="currentSemester"
            isEditable={isAdmin}
            onEditRequest={isAdmin ? undefined : openRequestModal}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.currentSemester}
            profileValue={profile.currentSemester}
          />
          <InfoItem
            label="Academic Advisor"
            value={profile.academicAdvisorName}
            fieldName="academicAdvisorName"
            isEditable={true}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.academicAdvisorName}
            profileValue={profile.academicAdvisorName}
            editModeRender={(currentValue, handleChange, name) => (
              <Input
                id={name as string}
                name={name as string}
                className="mt-1"
                value={currentValue || ""}
                onChange={handleChange}
                placeholder="Dr. Smith"
              />
            )}
          />
          <InfoItem
            label="Section / Batch (Overall)"
            value={profile.sectionOrBatch}
            fieldName="sectionOrBatch"
            isEditable={true}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.sectionOrBatch}
            profileValue={profile.sectionOrBatch}
            editModeRender={(currentValue, handleChange, name) => (
              <Input
                id={name as string}
                name={name as string}
                className="mt-1"
                value={currentValue || ""}
                onChange={handleChange}
                placeholder="A1"
              />
            )}
          />
          <InfoItem
            label="Admission Date"
            value={profile.admissionDate}
            fieldName="admissionDate"
            onEditRequest={openRequestModal}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.admissionDate}
            profileValue={profile.admissionDate}
          />
          <InfoItem
            label="Mode of Admission"
            value={profile.modeOfAdmission}
            fieldName="modeOfAdmission"
            isEditable={true}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.modeOfAdmission}
            profileValue={profile.modeOfAdmission}
            editModeRender={(currentValue, handleChange, name) => (
              <Input
                id={name as string}
                name={name as string}
                className="mt-1"
                value={currentValue || ""}
                onChange={handleChange}
                placeholder="CET"
              />
            )}
          />
        </CardContent>
      </Card>

      <Card className="shadow-prestige bg-white border border-kssem-border text-kssem-text rounded-sm light">
        <CardHeader className="border-b border-kssem-border">
          <CardTitle className="flex items-center text-xl font-serif text-kssem-navy">
            <FileText className="mr-3 h-6 w-6 text-kssem-gold" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DocumentOrActionItem
              label="ID Card"
              url={profile.idCardUrl}
              fieldName="idCardUrl"
              actionLabel="View ID Card"
            />
            <DocumentOrActionItem
              label="Admission Letter"
              url={profile.admissionLetterUrl}
              fieldName="admissionLetterUrl"
              actionLabel="View Admission Letter"
            />
            <DocumentOrActionItem
              label="10th Mark Sheet"
              url={profile.marksheet10thUrl}
              fieldName="marksheet10thUrl"
              actionLabel="View 10th Mark Sheet"
            />
            <DocumentOrActionItem
              label="12th Mark Sheet"
              url={profile.marksheet12thUrl}
              fieldName="marksheet12thUrl"
              actionLabel="View 12th Mark Sheet"
            />
            <DocumentOrActionItem
              label="Migration Certificate"
              url={profile.migrationCertificateUrl}
              fieldName="migrationCertificateUrl"
              actionLabel="View Migration Certificate"
            />
            <DocumentOrActionItem
              label="Bonafide Certificate"
              url={profile.bonafideCertificateUrl}
              fieldName="bonafideCertificateUrl"
              actionLabel="Download Bonafide"
              isDownloadable={true}
            />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 flex items-center text-md font-semibold text-kssem-text">
                <FileImage className="mr-2 h-5 w-5 text-kssem-navy" />
                Uploaded Photo
              </h4>
              <Avatar className="h-[100px] w-[100px] shadow-sm rounded-md">
                <AvatarImage
                  src={
                    (isEditMode &&
                    typeof editableProfile.uploadedPhotoUrl === "string"
                      ? editableProfile.uploadedPhotoUrl
                      : profile.uploadedPhotoUrl) || ""
                  }
                  alt="Uploaded Photo"
                  className="object-cover"
                  data-ai-hint="passport photo"
                />
                <AvatarFallback className="bg-kssem-gold/10 text-kssem-gold text-xl rounded-sm">
                  {getInitials(profile.name || "User")}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h4 className="mb-2 flex items-center text-md font-semibold text-kssem-text">
                <FileImage className="mr-2 h-5 w-5 text-kssem-navy" />
                Uploaded Signature
              </h4>
              {(
                isEditMode &&
                typeof editableProfile.uploadedSignatureUrl === "string"
                  ? editableProfile.uploadedSignatureUrl
                  : profile.uploadedSignatureUrl
              ) ? (
                <Image
                  src={
                    isEditMode &&
                    typeof editableProfile.uploadedSignatureUrl === "string"
                      ? editableProfile.uploadedSignatureUrl
                      : profile.uploadedSignatureUrl!
                  }
                  alt="Uploaded Signature"
                  width={200}
                  height={80}
                  className="rounded-sm border border-kssem-border bg-white object-contain p-1 shadow-sm"
                  data-ai-hint="signature"
                />
              ) : (
                <p className="text-sm text-kssem-text-muted">N/A</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-prestige bg-white border border-kssem-border text-kssem-text rounded-sm light">
        <CardHeader className="border-b border-kssem-border">
          <CardTitle className="flex items-center text-xl font-serif text-kssem-navy">
            <ClipboardList className="mr-3 h-6 w-6 text-kssem-gold" />
            Exam Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-1 gap-x-4 md:grid-cols-2">
          <InfoItem
            label="Exam Registration"
            value={profile.examRegistrationStatus}
            fieldName="examRegistrationStatus"
            isEditable={isAdmin}
            onEditRequest={isAdmin ? undefined : openRequestModal}
            isEditMode={isEditMode}
            handleInputChange={handleInputChange}
            editableProfileValue={editableProfile.examRegistrationStatus}
            profileValue={profile.examRegistrationStatus}
          />
          <DocumentOrActionItem
            label="Admit Card"
            url={profile.admitCardUrl}
            fieldName="admitCardUrl"
            actionLabel="Download Admit Card"
            isDownloadable={true}
            icon={Download}
          />
          <DocumentOrActionItem
            label="Internal Exam Timetable"
            url={profile.internalExamTimetableUrl}
            fieldName="internalExamTimetableUrl"
            actionLabel="View Timetable"
            icon={Eye}
          />
          <DocumentOrActionItem
            label="External Exam Timetable"
            url={profile.externalExamTimetableUrl}
            fieldName="externalExamTimetableUrl"
            actionLabel="View Timetable"
            icon={Eye}
          />
          <DocumentOrActionItem
            label="Results and Grade Cards"
            url={profile.resultsAndGradeCardsUrl}
            fieldName="resultsAndGradeCardsUrl"
            actionLabel="View Results"
            icon={Eye}
          />
          <div className="md:col-span-1">
            <DocumentOrActionItem
              revalRef={revalRef}
              label={`Revaluation (${profile.revaluationRequestStatus || "N/A"})`}
              url={
                profile.revaluationRequestStatus === "None" &&
                profile.revaluationRequestLink
                  ? profile.revaluationRequestLink
                  : undefined
              }
              fieldName="revaluationRequestLink"
              actionLabel={
                profile.revaluationRequestStatus === "None"
                  ? "Request Revaluation"
                  : undefined
              }
              icon={Edit3}
              actionType={
                profile.revaluationRequestStatus === "None" ? "link" : "button"
              }
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Request Change for {requestFieldInfo?.label}
            </DialogTitle>
            <DialogDescription>
              Your request to change "{requestFieldInfo?.label}" will be sent to
              an administrator for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label
                htmlFor="currentValue"
                className="text-left sm:text-right col-span-1">
                Current Value
              </Label>
              <Input
                id="currentValue"
                value={requestOldValue}
                readOnly
                className="col-span-3 bg-kssem-bg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label
                htmlFor="newValue"
                className="text-left sm:text-right col-span-1">
                New Value
              </Label>
              <Input
                id="newValue"
                value={requestNewValue}
                onChange={(e) => setRequestNewValue(e.target.value)}
                className="col-span-3"
                placeholder={`Enter new ${requestFieldInfo?.label.toLowerCase()}`}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setRequestFieldInfo(null);
                  setRequestNewValue("");
                }}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmitChangeRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedClassroomForClassmates && (
        <Dialog
          open={isClassmatesModalOpen}
          onOpenChange={(isOpen) => {
            setIsClassmatesModalOpen(isOpen);
            if (!isOpen) {
              setSelectedClassroomForClassmates(null); // Clear selection when closing
              setClassmates([]); // Clear classmates list
            }
          }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Classmates in {selectedClassroomForClassmates.classroomName}
              </DialogTitle>
              <DialogDescription>
                Subject: {selectedClassroomForClassmates.classroomSubject}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {loadingClassmates && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading classmates...</span>
                </div>
              )}
              {fetchClassmatesError && (
                <p className="text-red-400 text-center">
                  {fetchClassmatesError}
                </p>
              )}
              {!loadingClassmates &&
                !fetchClassmatesError &&
                classmates.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-kssem-border hover:bg-kssem-bg">
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Batch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classmates.map((classmate) => (
                        <TableRow key={classmate.userId}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-kssem-gold/10 text-kssem-gold">
                                {getInitials(classmate.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>{classmate.name}</TableCell>
                          <TableCell>{classmate.studentIdNumber}</TableCell>
                          <TableCell>{classmate.batch || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              {!loadingClassmates &&
                !fetchClassmatesError &&
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
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <MainHeader />
      <PageHeader
        title="My Profile"
        description="Manage your personal academic profile, contact details, and semester-level information. Keep your data accurate for official records."
        actions={
          <div className="flex items-center gap-2 bg-kssem-bg border border-kssem-border px-4 py-2 rounded-sm shadow-sm">
            <UserSquare className="h-4 w-4 text-kssem-gold" />
            <span className="text-kssem-navy text-sm font-bold tracking-wide">
              Student Identity Verified
            </span>
          </div>
        }
      />
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-12 w-32 self-end" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-80 w-full rounded-lg" />
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          }>
          <ProfileDetailsLoader />
        </Suspense>
      </div>
    </>
  );
}
