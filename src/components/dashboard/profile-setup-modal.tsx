"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { auth as clientAuth } from "@/lib/firebase/client";
import { updateStudentProfile, StudentProfile } from "@/services/profile";
import { useToast } from "@/hooks/use-toast";
import {
  UserCircle,
  Contact,
  Droplets,
  MapPin,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ProfileSetupModalProps {
  profile: StudentProfile;
  onComplete: () => void;
}

export function ProfileSetupModal({
  profile,
  onComplete,
}: ProfileSetupModalProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name || "",
    contactNumber:
      profile.contactNumber === "N/A" ? "" : profile.contactNumber || "",
    dateOfBirth: profile.dateOfBirth === "N/A" ? "" : profile.dateOfBirth || "",
    bloodGroup: profile.bloodGroup === "N/A" ? "" : profile.bloodGroup || "",
    permanentAddress:
      profile.permanentAddress === "N/A" ? "" : profile.permanentAddress || "",
  });

  useEffect(() => {
    // Check if critical fields are missing
    const isMissingCriticalInfo =
      !profile.name ||
      profile.name === "N/A" ||
      !profile.contactNumber ||
      profile.contactNumber === "N/A" ||
      !profile.dateOfBirth ||
      profile.dateOfBirth === "N/A" ||
      !profile.bloodGroup ||
      profile.bloodGroup === "N/A";

    if (isMissingCriticalInfo) {
      setIsOpen(true);
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientAuth?.currentUser) return;

    setLoading(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();

      // Basic validation
      if (!formData.name || !formData.contactNumber || !formData.bloodGroup) {
        throw new Error("Please fill in all basic information.");
      }

      await updateStudentProfile(idToken, formData);

      toast({
        title: "Profile Finalized",
        description:
          "Welcome to the portal! Your basic details have been saved.",
      });

      setIsOpen(false);
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not save details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-white border-t-[4px] border-kssem-gold rounded-sm light">
        <DialogHeader className="space-y-3">
          <div className="bg-kssem-gold/10 w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto">
            <Sparkles className="h-6 w-6 text-kssem-gold" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-center text-kssem-navy">
            Welcome to the KSSEM Portal!
          </DialogTitle>
          <DialogDescription className="text-center text-kssem-text-muted">
            Please complete your basic profile setup to unlock full access to
            your academic and finance records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider text-kssem-text-muted">
              Full Name
            </Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-4 w-4 text-kssem-navy/40" />
              <Input
                id="name"
                name="name"
                className="pl-9 h-11 border-kssem-border focus-visible:ring-kssem-navy"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="contactNumber"
                className="text-xs font-bold uppercase tracking-wider text-kssem-text-muted">
                Contact Number
              </Label>
              <div className="relative">
                <Contact className="absolute left-3 top-3 h-4 w-4 text-kssem-navy/40" />
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  className="pl-9 h-11 border-kssem-border"
                  placeholder="+91..."
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="bloodGroup"
                className="text-xs font-bold uppercase tracking-wider text-kssem-text-muted">
                Blood Group
              </Label>
              <div className="relative">
                <Droplets className="absolute left-3 top-3 h-4 w-4 text-kssem-navy/40" />
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  className="flex h-11 w-full rounded-md border border-kssem-border bg-transparent px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-kssem-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required>
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="dateOfBirth"
              className="text-xs font-bold uppercase tracking-wider text-kssem-text-muted">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className="h-11 border-kssem-border"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="permanentAddress"
              className="text-xs font-bold uppercase tracking-wider text-kssem-text-muted">
              Address
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-kssem-navy/40" />
              <Input
                id="permanentAddress"
                name="permanentAddress"
                className="pl-9 h-11 border-kssem-border"
                placeholder="City, State, Country"
                value={formData.permanentAddress}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-kssem-gold text-kssem-navy font-bold hover:bg-[#c4a030] shadow-md transition-all mt-4"
            disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Finalize Profile
          </Button>
          <p className="text-[10px] text-center text-kssem-text-muted uppercase tracking-widest font-bold">
            Guaranteed Secure • Official KSSEM Institution Portal
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
