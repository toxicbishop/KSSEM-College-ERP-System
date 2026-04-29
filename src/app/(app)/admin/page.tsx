"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Users,
  Settings,
  ShieldAlert,
  Edit,
  Trash2,
  CheckCircle,
  Filter as FilterIcon,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentProfile } from "@/services/profile";

const ALL_ROLES_VALUE = "__ALL_ROLES__";
const ALL_COURSES_VALUE = "__ALL_COURSES__";

interface UserData extends StudentProfile {
  id: string;
  createdAt?: any;
}

const initialNewUserState: Omit<UserData, "id" | "createdAt"> = {
  name: "",
  studentId: "",
  email: "",
  parentEmail: "",
  role: "student",
  profilePhotoUrl: "",
  dateOfBirth: "",
  gender: "",
  contactNumber: "",
  permanentAddress: "",
  currentAddress: "",
  bloodGroup: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  enrollmentNumber: "",
  courseProgram: "",
  department: "",
  currentYear: 0,
  currentSemester: 0,
  academicAdvisorName: "",
  sectionOrBatch: "",
  admissionDate: "",
  modeOfAdmission: "",
  idCardUrl: "",
  admissionLetterUrl: "",
  marksheet10thUrl: "",
  marksheet12thUrl: "",
  migrationCertificateUrl: "",
  bonafideCertificateUrl: "",
  uploadedPhotoUrl: "",
  uploadedSignatureUrl: "",
  examRegistrationStatus: "Not Registered",
  admitCardUrl: "",
  internalExamTimetableUrl: "",
  externalExamTimetableUrl: "",
  resultsAndGradeCardsUrl: "",
  revaluationRequestStatus: "None",
  revaluationRequestLink: "",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] =
    useState<Omit<UserData, "id" | "createdAt">>(initialNewUserState);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState(""); // Empty string for 'All Roles'
  const [filterCourse, setFilterCourse] = useState(""); // Empty string for 'All Courses'
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/signin");
      setCheckingRole(false);
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      if (db) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userDataFromDb = userDocSnap.data();
            if (userDataFromDb.role === "admin") {
              userIsCurrentlyAdmin = true;
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          toast({
            title: "Error",
            description:
              "Could not verify admin role. Please check Firestore permissions.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Database Error",
          description:
            "Firestore is not available. Cannot verify admin role.",
          variant: "destructive",
        });
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive",
        });
        router.push("/");
      }
      setCheckingRole(false);
    };

    checkAdminAccess();
  }, [user, authLoading, router, toast]);

  const fetchUsers = async () => {
    if (!db || !isAdmin) {
      if (!isAdmin && !checkingRole) {
        // console.log("User is not admin, skipping fetchUsers.");
      }
      if (!db) {
        console.error("Firestore DB instance is not available in fetchUsers.");
      }
      setLoadingUsers(false);
      return;
    }
    setLoadingUsers(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const courses = new Set<string>();
      const usersList = usersSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const courseProgramValue = data.courseProgram || data.major || "";
        if (courseProgramValue) {
          courses.add(courseProgramValue);
        }
        return {
          id: docSnap.id,
          ...data,
          courseProgram: courseProgramValue,
        } as UserData;
      });
      setUsersData(usersList);
      setUniqueCourses(Array.from(courses).sort());
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error Fetching Users",
        description:
          "Could not fetch users data. Ensure Firestore rules allow 'list' operation on 'users' collection for admins.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading && !checkingRole) {
      fetchUsers();
    }
  }, [isAdmin, authLoading, checkingRole]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const SPREADSHEET_FIELD_NAMES = ["currentYear", "currentSemester"];
    setNewUser((prev) => ({
      ...prev,
      [name]: SPREADSHEET_FIELD_NAMES.includes(name) ? parseInt(value) : value,
    }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!editingUser) return;
    const { name, value } = e.target;
    const SPREADSHEET_FIELD_NAMES = ["currentYear", "currentSemester"];
    setEditingUser((prev) =>
      prev
        ? {
            ...prev,
            [name]: SPREADSHEET_FIELD_NAMES.includes(name)
              ? parseInt(value)
              : value,
          }
        : null,
    );
  };

  const validateUserProfile = (
    profile: Omit<UserData, "id" | "createdAt"> | UserData,
  ): boolean => {
    if (
      !profile.name ||
      !profile.studentId ||
      !profile.courseProgram ||
      !profile.email ||
      !profile.parentEmail ||
      !profile.role
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Name, Student ID, Course / Program, Email, Parent's Email, Role).",
        variant: "destructive",
      });
      return false;
    }
    if (
      !/\S+@\S+\.\S+/.test(profile.email) ||
      (profile.parentEmail && !/\S+@\S+\.\S+/.test(profile.parentEmail))
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter valid email addresses.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleCreateUser = async () => {
    if (!db || !isAdmin) return;
    if (!validateUserProfile(newUser)) return;

    try {
      const usersCollection = collection(db, "users");
      await addDoc(usersCollection, {
        ...newUser,
        currentYear: Number(newUser.currentYear) || 0,
        currentSemester: Number(newUser.currentSemester) || 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "User profile created successfully in Firestore.",
      });
      fetchUsers();
      setNewUser(initialNewUserState);
    } catch (error) {
      console.error("Error creating user profile:", error);
      toast({
        title: "Error Creating User",
        description:
          "Could not create user profile. Ensure Firestore rules allow 'create' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (userToEdit: UserData) => {
    setEditingUser({ ...userToEdit });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!db || !isAdmin || !editingUser || !editingUser.id) return;
    if (!validateUserProfile(editingUser)) return;

    try {
      const userDocRef = doc(db, "users", editingUser.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...userDataToUpdate } = editingUser;

      await updateDoc(userDocRef, {
        ...userDataToUpdate,
        currentYear: Number(editingUser.currentYear) || 0,
        currentSemester: Number(editingUser.currentSemester) || 0,
      });

      toast({
        title: "Success",
        description: "User updated successfully.",
      });
      fetchUsers();
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error Updating User",
        description:
          "Could not update user. Ensure Firestore rules allow 'update' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAdmin) return;
    try {
      const userDocRef = doc(db, "users", userId);
      await deleteDoc(userDocRef);

      toast({
        title: "Success",
        description: "User profile deleted successfully from Firestore.",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user profile:", error);
      toast({
        title: "Error Deleting User",
        description:
          "Could not delete user profile. Ensure Firestore rules allow 'delete' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return usersData
      .filter((u) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (u.name || "").toLowerCase().includes(searchLower) ||
          (u.studentId || "").toLowerCase().includes(searchLower) ||
          (u.email || "").toLowerCase().includes(searchLower);
        const matchesRole = filterRole ? u.role === filterRole : true;
        const matchesCourse = filterCourse
          ? u.courseProgram === filterCourse
          : true;
        return matchesSearch && matchesRole && matchesCourse;
      })
      .sort((a, b) =>
        (a.studentId || "").localeCompare(b.studentId || "", undefined, {
          numeric: true,
        }),
      );
  }, [usersData, searchTerm, filterRole, filterCourse]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterRole("");
    setFilterCourse("");
  };

  if (authLoading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="p-6">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
              <CardTitle>Loading Admin Panel...</CardTitle>
              <CardDescription>
                Please wait while we verify your access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const renderProfileFormFields = (
    data: Omit<UserData, "id" | "createdAt"> | UserData,
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => void,
  ) => (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
      {/* Personal Information */}
      <div className="md:col-span-2 font-serif font-bold text-lg mb-2 border-b border-kssem-border pb-1 text-kssem-navy">
        Personal Information
      </div>
      <div>
        <Label htmlFor="formName">Full Name*</Label>
        <Input
          id="formName"
          name="name"
          value={data.name || ""}
          onChange={onChange}
          placeholder="John Doe"
        />
      </div>
      <div>
        <Label htmlFor="formStudentId">Student ID*</Label>
        <Input
          id="formStudentId"
          name="studentId"
          value={data.studentId || ""}
          onChange={onChange}
          placeholder="S12345"
        />
      </div>
      <div>
        <Label htmlFor="formEmail">Email*</Label>
        <Input
          id="formEmail"
          name="email"
          type="email"
          value={data.email || ""}
          onChange={onChange}
          placeholder="user@example.com"
        />
      </div>
      <div>
        <Label htmlFor="formParentEmail">Parent's Email*</Label>
        <Input
          id="formParentEmail"
          name="parentEmail"
          type="email"
          value={data.parentEmail || ""}
          onChange={onChange}
          placeholder="parent@example.com"
        />
      </div>
      <div>
        <Label htmlFor="formProfilePhotoUrl">Profile Photo URL</Label>
        <Input
          id="formProfilePhotoUrl"
          name="profilePhotoUrl"
          value={data.profilePhotoUrl || ""}
          onChange={onChange}
          placeholder="https://example.com/photo.jpg"
        />
      </div>
      <div>
        <Label htmlFor="formDateOfBirth">Date of Birth</Label>
        <Input
          id="formDateOfBirth"
          name="dateOfBirth"
          type="date"
          value={data.dateOfBirth || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formGender">Gender</Label>
        <select
          id="formGender"
          name="gender"
          value={data.gender || ""}
          onChange={onChange}
          className="input-class mt-1 block w-full rounded-sm border-kssem-border bg-white p-2 shadow-sm focus:border-kssem-navy focus:ring focus:ring-kssem-navy focus:ring-opacity-50">
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <Label htmlFor="formContactNumber">Contact Number</Label>
        <Input
          id="formContactNumber"
          name="contactNumber"
          value={data.contactNumber || ""}
          onChange={onChange}
          placeholder="+1234567890"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="formPermanentAddress">Permanent Address</Label>
        <Textarea
          id="formPermanentAddress"
          name="permanentAddress"
          value={data.permanentAddress || ""}
          onChange={onChange}
          placeholder="123 Main St, City, Country"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="formCurrentAddress">Current Address</Label>
        <Textarea
          id="formCurrentAddress"
          name="currentAddress"
          value={data.currentAddress || ""}
          onChange={onChange}
          placeholder="Apt 4B, Complex, City"
        />
      </div>
      <div>
        <Label htmlFor="formBloodGroup">Blood Group</Label>
        <Input
          id="formBloodGroup"
          name="bloodGroup"
          value={data.bloodGroup || ""}
          onChange={onChange}
          placeholder="O+"
        />
      </div>
      <div>
        <Label htmlFor="formEmergencyContactName">Emergency Contact Name</Label>
        <Input
          id="formEmergencyContactName"
          name="emergencyContactName"
          value={data.emergencyContactName || ""}
          onChange={onChange}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <Label htmlFor="formEmergencyContactNumber">
          Emergency Contact Number
        </Label>
        <Input
          id="formEmergencyContactNumber"
          name="emergencyContactNumber"
          value={data.emergencyContactNumber || ""}
          onChange={onChange}
          placeholder="+0987654321"
        />
      </div>

      {/* Academic Details */}
      <div className="md:col-span-2 font-serif font-bold text-lg mt-4 mb-2 border-b border-kssem-border pb-1 text-kssem-navy">
        Academic Details
      </div>
      <div>
        <Label htmlFor="formEnrollmentNumber">Enrollment Number</Label>
        <Input
          id="formEnrollmentNumber"
          name="enrollmentNumber"
          value={data.enrollmentNumber || ""}
          onChange={onChange}
          placeholder="ENR123"
        />
      </div>
      <div>
        <Label htmlFor="formCourseProgram">Course / Program*</Label>
        <Input
          id="formCourseProgram"
          name="courseProgram"
          value={data.courseProgram || ""}
          onChange={onChange}
          placeholder="B.E in Computer Science"
        />
      </div>
      <div>
        <Label htmlFor="formDepartment">Department</Label>
        <Input
          id="formDepartment"
          name="department"
          value={data.department || ""}
          onChange={onChange}
          placeholder="Computer Engineering"
        />
      </div>
      <div>
        <Label htmlFor="formCurrentYear">Current Year</Label>
        <Input
          id="formCurrentYear"
          name="currentYear"
          type="number"
          value={data.currentYear || 0}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formCurrentSemester">Current Semester</Label>
        <Input
          id="formCurrentSemester"
          name="currentSemester"
          type="number"
          value={data.currentSemester || 0}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formAcademicAdvisorName">Academic Advisor</Label>
        <Input
          id="formAcademicAdvisorName"
          name="academicAdvisorName"
          value={data.academicAdvisorName || ""}
          onChange={onChange}
          placeholder="Dr. Smith"
        />
      </div>
      <div>
        <Label htmlFor="formSectionOrBatch">Section / Batch</Label>
        <Input
          id="formSectionOrBatch"
          name="sectionOrBatch"
          value={data.sectionOrBatch || ""}
          onChange={onChange}
          placeholder="A1"
        />
      </div>
      <div>
        <Label htmlFor="formAdmissionDate">Admission Date</Label>
        <Input
          id="formAdmissionDate"
          name="admissionDate"
          type="date"
          value={data.admissionDate || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formModeOfAdmission">Mode of Admission</Label>
        <Input
          id="formModeOfAdmission"
          name="modeOfAdmission"
          value={data.modeOfAdmission || ""}
          onChange={onChange}
          placeholder="CET"
        />
      </div>

      {/* Documents */}
      <div className="md:col-span-2 font-serif font-bold text-lg mt-4 mb-2 border-b border-kssem-border pb-1 text-kssem-navy">
        Documents (URLs)
      </div>
      <div>
        <Label htmlFor="formIdCardUrl">ID Card URL</Label>
        <Input
          id="formIdCardUrl"
          name="idCardUrl"
          value={data.idCardUrl || ""}
          onChange={onChange}
          placeholder="https://example.com/id.pdf"
        />
      </div>
      <div>
        <Label htmlFor="formAdmissionLetterUrl">Admission Letter URL</Label>
        <Input
          id="formAdmissionLetterUrl"
          name="admissionLetterUrl"
          value={data.admissionLetterUrl || ""}
          onChange={onChange}
          placeholder="https://example.com/admission.pdf"
        />
      </div>
      <div>
        <Label htmlFor="formMarksheet10thUrl">10th Marksheet URL</Label>
        <Input
          id="formMarksheet10thUrl"
          name="marksheet10thUrl"
          value={data.marksheet10thUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formMarksheet12thUrl">12th Marksheet URL</Label>
        <Input
          id="formMarksheet12thUrl"
          name="marksheet12thUrl"
          value={data.marksheet12thUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formMigrationCertificateUrl">
          Migration Certificate URL
        </Label>
        <Input
          id="formMigrationCertificateUrl"
          name="migrationCertificateUrl"
          value={data.migrationCertificateUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formBonafideCertificateUrl">
          Bonafide Certificate URL
        </Label>
        <Input
          id="formBonafideCertificateUrl"
          name="bonafideCertificateUrl"
          value={data.bonafideCertificateUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formUploadedPhotoUrl">Uploaded Photo URL</Label>
        <Input
          id="formUploadedPhotoUrl"
          name="uploadedPhotoUrl"
          value={data.uploadedPhotoUrl || ""}
          onChange={onChange}
          placeholder="https://example.com/uploaded-photo.jpg"
        />
      </div>
      <div>
        <Label htmlFor="formUploadedSignatureUrl">Uploaded Signature URL</Label>
        <Input
          id="formUploadedSignatureUrl"
          name="uploadedSignatureUrl"
          value={data.uploadedSignatureUrl || ""}
          onChange={onChange}
          placeholder="https://example.com/signature.png"
        />
      </div>

      {/* Exam Details */}
      <div className="md:col-span-2 font-serif font-bold text-lg mt-4 mb-2 border-b border-kssem-border pb-1 text-kssem-navy">
        Exam Details
      </div>
      <div>
        <Label htmlFor="formExamRegistrationStatus">
          Exam Registration Status
        </Label>
        <select
          id="formExamRegistrationStatus"
          name="examRegistrationStatus"
          value={data.examRegistrationStatus || "Not Registered"}
          onChange={onChange}
          className="input-class mt-1 block w-full rounded-sm border-kssem-border bg-white p-2 shadow-sm focus:border-kssem-navy focus:ring focus:ring-kssem-navy focus:ring-opacity-50">
          <option value="Not Registered">Not Registered</option>
          <option value="Registered">Registered</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
      <div>
        <Label htmlFor="formAdmitCardUrl">Admit Card URL</Label>
        <Input
          id="formAdmitCardUrl"
          name="admitCardUrl"
          value={data.admitCardUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formInternalExamTimetableUrl">
          Internal Exam Timetable URL
        </Label>
        <Input
          id="formInternalExamTimetableUrl"
          name="internalExamTimetableUrl"
          value={data.internalExamTimetableUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formExternalExamTimetableUrl">
          External Exam Timetable URL
        </Label>
        <Input
          id="formExternalExamTimetableUrl"
          name="externalExamTimetableUrl"
          value={data.externalExamTimetableUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formResultsAndGradeCardsUrl">
          Results/Grade Cards URL
        </Label>
        <Input
          id="formResultsAndGradeCardsUrl"
          name="resultsAndGradeCardsUrl"
          value={data.resultsAndGradeCardsUrl || ""}
          onChange={onChange}
        />
      </div>
      <div>
        <Label htmlFor="formRevaluationRequestStatus">
          Revaluation Request Status
        </Label>
        <select
          id="formRevaluationRequestStatus"
          name="revaluationRequestStatus"
          value={data.revaluationRequestStatus || "None"}
          onChange={onChange}
          className="input-class mt-1 block w-full rounded-sm border-kssem-border bg-white p-2 shadow-sm focus:border-kssem-navy focus:ring focus:ring-kssem-navy focus:ring-opacity-50">
          <option value="None">None</option>
          <option value="Requested">Requested</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      <div>
        <Label htmlFor="formRevaluationRequestLink">
          Revaluation Request Link
        </Label>
        <Input
          id="formRevaluationRequestLink"
          name="revaluationRequestLink"
          value={data.revaluationRequestLink || ""}
          onChange={onChange}
        />
      </div>

      {/* Role Setting */}
      <div className="md:col-span-2 font-serif font-bold text-lg mt-4 mb-2 border-b border-kssem-border pb-1 text-kssem-navy">
        System Role
      </div>
      <div>
        <Label htmlFor="formRole">Role*</Label>
        <select
          id="formRole"
          name="role"
          value={data.role || "student"}
          onChange={onChange}
          className="input-class mt-1 block w-full rounded-sm border-kssem-border bg-white p-2 shadow-sm focus:border-kssem-navy focus:ring focus:ring-kssem-navy focus:ring-opacity-50">
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-kssem-navy tracking-tight">
          Admin Panel
        </h1>
        <Button
          className="bg-kssem-gold hover:bg-[#c4a030] text-kssem-navy font-bold rounded-sm flex items-center gap-2 uppercase tracking-wider text-sm"
          onClick={() => {
            document
              .getElementById("add-user-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}>
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Outer Content Card */}
      <div className="bg-white rounded-sm border border-kssem-border shadow-prestige overflow-hidden">
        <div className="p-6">
          {/* Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="flex items-center text-kssem-text-muted font-bold uppercase tracking-wider text-xs mr-2 mb-2 md:mb-0">
              Filter By
            </div>
            <div>
              <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1 block">
                Role
              </Label>
              <Select
                value={filterRole}
                onValueChange={(value) =>
                  setFilterRole(value === ALL_ROLES_VALUE ? "" : value)
                }>
                <SelectTrigger className="w-full md:w-[180px] bg-white border-kssem-border text-kssem-text focus:ring-kssem-navy rounded-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-white border-kssem-border text-kssem-text">
                  <SelectItem value={ALL_ROLES_VALUE}>All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1 block">
                Department/Course
              </Label>
              <Select
                value={filterCourse}
                onValueChange={(value) =>
                  setFilterCourse(value === ALL_COURSES_VALUE ? "" : value)
                }>
                <SelectTrigger className="w-full md:w-[220px] bg-white border-kssem-border text-kssem-text focus:ring-kssem-navy rounded-sm">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-white border-kssem-border text-kssem-text">
                  <SelectItem value={ALL_COURSES_VALUE}>
                    All Departments
                  </SelectItem>
                  {uniqueCourses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 md:ml-auto">
              <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kssem-text-muted hidden" />
                <Input
                  className="w-full bg-white border-kssem-border text-kssem-text placeholder:text-kssem-text-muted focus-visible:ring-kssem-navy rounded-sm pl-10"
                  placeholder="Search by Name, ID, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kssem-text-muted"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-xs text-kssem-text-muted font-bold uppercase tracking-wider border-b-2 border-kssem-navy">
                      <tr>
                        <th className="px-4 py-3 pb-4">Name</th>
                        <th className="px-4 py-3 pb-4">Student/Staff ID</th>
                        <th className="px-4 py-3 pb-4">Email</th>
                        <th className="px-4 py-3 pb-4">Role</th>
                        <th className="px-4 py-3 pb-4">Department</th>
                        <th className="px-4 py-3 pb-4">Status</th>
                        <th className="px-4 py-3 pb-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-kssem-border">
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="text-kssem-text-muted hover:bg-kssem-gold-light/30 transition-colors">
                          <td className="px-4 py-4 text-kssem-text font-medium">
                            {u.name || "N/A"}
                          </td>
                          <td className="px-4 py-4">{u.studentId || "N/A"}</td>
                          <td className="px-4 py-4">{u.email || "N/A"}</td>
                          <td className="px-4 py-4 capitalize">
                            {u.role || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            {u.department || u.courseProgram || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-status-bg-success text-status-success border border-status-success/20">
                              Active
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(u)}
                                className="h-8 w-8 rounded-sm bg-transparent border border-kssem-border text-kssem-navy hover:text-white hover:bg-kssem-navy">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-sm bg-transparent border border-destructive/50 text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-kssem-border text-kssem-text">
                                  <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                    <DialogDescription className="text-kssem-text-muted">
                                      Are you sure you want to delete the
                                      profile for {u.name || u.email}? This
                                      action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(u.id)}>
                                      Delete
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pseudo Pagination Footer */}
                  <div className="flex justify-end items-center mt-6 text-sm text-kssem-text-muted">
                    <span className="mr-4 hover:text-kssem-navy cursor-pointer">
                      Previous
                    </span>
                    <div className="flex gap-1">
                      <span className="flex items-center justify-center w-6 h-6 rounded-sm bg-kssem-navy text-white cursor-pointer">
                        1
                      </span>
                      <span className="flex items-center justify-center w-6 h-6 rounded-sm hover:bg-kssem-bg hover:text-kssem-navy cursor-pointer">
                        2
                      </span>
                      <span className="flex items-center justify-center w-6 h-6 rounded-sm hover:bg-kssem-bg hover:text-kssem-navy cursor-pointer">
                        3
                      </span>
                      <span className="flex items-center justify-center px-1">
                        ...
                      </span>
                    </div>
                    <span className="ml-4 hover:text-kssem-navy cursor-pointer">
                      Next
                    </span>
                  </div>
                </div>
              ) : searchTerm || filterRole || filterCourse ? (
                <p className="text-center text-muted-foreground mt-4">
                  No users match the current filters.
                </p>
              ) : (
                <p className="text-center text-muted-foreground mt-4">
                  No user profiles found. Ensure Firestore rules allow listing
                  users for admins.
                </p>
              )}
            </>
          )}
          <div
            id="add-user-section"
            className="bg-white rounded-sm border border-kssem-border shadow-prestige overflow-hidden mt-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-kssem-border pb-4">
                <h2 className="text-lg font-serif font-bold text-kssem-navy">
                  Add New User
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-kssem-text-muted hover:text-kssem-navy w-8 h-8 hover:bg-kssem-bg disabled:opacity-50"
                  onClick={() =>
                    document
                      .getElementById("add-user-section-content")
                      ?.classList.toggle("hidden")
                  }>
                  <span className="text-xl">?</span>
                </Button>
              </div>

              <div id="add-user-section-content" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Full Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="bg-white border-kssem-border text-kssem-text rounded-sm focus-visible:ring-kssem-navy"
                      name="name"
                      value={newUser.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Student/Staff ID<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="bg-white border-kssem-border text-kssem-text rounded-sm focus-visible:ring-kssem-navy"
                      name="studentId"
                      value={newUser.studentId}
                      onChange={handleInputChange}
                      placeholder="S12345"
                    />
                  </div>
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Email<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="bg-white border-kssem-border text-kssem-text rounded-sm focus-visible:ring-kssem-navy"
                      name="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Role<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="role"
                      value={newUser.role}
                      onValueChange={(val) =>
                        handleInputChange({
                          target: { name: "role", value: val },
                        } as any)
                      }>
                      <SelectTrigger className="bg-white border-kssem-border text-kssem-text rounded-sm focus:ring-kssem-navy">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-kssem-border text-kssem-text">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Gender<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="gender"
                      value={newUser.gender}
                      onValueChange={(val) =>
                        handleInputChange({
                          target: { name: "gender", value: val },
                        } as any)
                      }>
                      <SelectTrigger className="bg-white border-kssem-border text-kssem-text rounded-sm focus:ring-kssem-navy">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-kssem-border text-kssem-text">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Department<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="department"
                      value={newUser.department}
                      onValueChange={(val) =>
                        handleInputChange({
                          target: { name: "department", value: val },
                        } as any)
                      }>
                      <SelectTrigger className="bg-white border-kssem-border text-kssem-text rounded-sm focus:ring-kssem-navy">
                        <SelectValue placeholder="Select Dept" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-kssem-border text-kssem-text">
                        <SelectItem value="CS">CS</SelectItem>
                        <SelectItem value="EC">EC</SelectItem>
                        <SelectItem value="ME">ME</SelectItem>
                        <SelectItem value="CV">CV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Date of Birth
                    </Label>
                    <Input
                      type="date"
                      className="bg-transparent border-[#475569] text-[#8A99BB] rounded-md focus-visible:ring-[#2dd4bf]"
                      name="dateOfBirth"
                      value={newUser.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <details className="text-[#8A99BB] text-sm cursor-pointer group">
                  <summary className="hover:text-white font-medium mb-4 list-none flex items-center gap-2">
                    <span className="text-xs group-open:rotate-90 transition-transform">
                      ?
                    </span>{" "}
                    Show Advanced/Required Fields
                  </summary>
                  <div className="bg-[#1A222C] p-4 rounded-lg border border-[#334155] text-white cursor-auto">
                    {renderProfileFormFields(newUser, handleInputChange)}
                  </div>
                </details>

                <div className="flex gap-3 pt-4 border-t border-[#334155]">
                  <Button
                    onClick={handleCreateUser}
                    className="bg-[#2dd4bf] hover:bg-[#14b8a6] text-black font-semibold rounded-md flex items-center gap-2 px-6">
                    Create User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewUser(initialNewUserState)}
                    className="bg-[#475569] hover:bg-[#334155] text-white border-0 font-medium rounded-md px-6">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End main container */}

      {editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-white border-kssem-border text-kssem-text max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
              <DialogDescription className="text-[#8A99BB]">
                Modify the details for this user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {renderProfileFormFields(editingUser, handleEditInputChange)}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-[#475569] text-white hover:bg-[#334155]"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                className="bg-[#2dd4bf] text-black hover:bg-[#14b8a6]">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="hidden">
        <Card className="bg-white border-kssem-border text-kssem-text">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" /> System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/admin/settings")}
              className="mt-2 bg-[#475569] hover:bg-[#334155] text-white border-0">
              Configure Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
