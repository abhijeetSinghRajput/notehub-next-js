"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X, Camera, Image as ImageIcon, Trash2, LinkIcon } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { validateUsername, isEmail } from "@/lib/validator";
import { GetPlatformName, getPlatformIcon, getUsernameFromUrl } from "@/lib/platform";
import ProfileTag from "@/components/profile-tag";

const RequiredAsterisk = () => <span className="text-destructive ml-1">*</span>;

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    bio: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [socials, setSocials] = useState<{ url: string }[]>([]);

  // Photo state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Validation state
  const [userNameStatus, setUserNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [userNameError, setUserNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const { createUser, uploadUserAvatar, uploadUserCover } = useAdminStore();

  const resetForm = () => {
    setFormData({
      fullName: "",
      userName: "",
      email: "",
      password: "",
      bio: "",
    });
    setSkills([]);
    setSocials([]);
    setAvatarFile(null);
    setAvatarPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    setUserNameStatus("idle");
    setEmailStatus("idle");
    setUserNameError("");
    setEmailError("");
    setLoading(false);
  };

  // Debounced username check
  useEffect(() => {
    const { isValid, error } = validateUsername(formData.userName);

    if (!formData.userName) {
      setUserNameStatus("idle");
      setUserNameError("");
      return;
    }

    if (!isValid) {
      setUserNameStatus("taken"); // Using "taken" status to show red border/error
      setUserNameError(error);
      return;
    }

    setUserNameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/user/check-username/${formData.userName}`);
        if (res.data.available) {
          setUserNameStatus("available");
          setUserNameError("");
        } else {
          setUserNameStatus("taken");
          setUserNameError("Username is already taken");
        }
      } catch (err) {
        setUserNameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.userName]);

  // Debounced email check
  useEffect(() => {
    if (!formData.email) {
      setEmailStatus("idle");
      setEmailError("");
      return;
    }

    if (!isEmail(formData.email)) {
      setEmailStatus("taken"); // Using "taken" to trigger red border
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/user/check-email/${formData.email}`);
        if (res.data.available) {
          setEmailStatus("available");
          setEmailError("");
        } else {
          setEmailStatus("taken");
          setEmailError("Email is already registered");
        }
      } catch (err) {
        setEmailStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const addSocial = () => setSocials([...socials, { url: "" }]);
  const removeSocial = (index: number) => setSocials(socials.filter((_, i) => i !== index));
  const updateSocial = (index: number, url: string) => {
    const newSocials = [...socials];
    newSocials[index].url = url;
    setSocials(newSocials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userNameStatus === "taken" || emailStatus === "taken") {
      toast.error("Please fix validation errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUser({
        ...formData,
        socials,
        skills,
      });

      if (result.success && result.user) {
        const userId = result.user._id;

        // Upload photos if any
        const uploadPromises = [];
        if (avatarFile) uploadPromises.push(uploadUserAvatar(userId, avatarFile));
        if (coverFile) uploadPromises.push(uploadUserCover(userId, coverFile));

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }

        toast.success("User created successfully");
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.message || "Failed to create user");
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.fullName.trim().length > 0 &&
    validateUsername(formData.userName).isValid &&
    userNameStatus === "available" &&
    isEmail(formData.email) &&
    emailStatus === "available" &&
    formData.password.length >= 6;

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-background z-10 border-b">
          <DialogTitle>Create New User Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Photo Selection */}
          <div className="space-y-4">
            <Label>Profile & Cover Photos</Label>
            <div className="relative h-32 w-full rounded-lg bg-muted border">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                <Label htmlFor="cover-upload" className="cursor-pointer bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/40 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                  <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                </Label>
              </div>

              {/* Avatar overlay */}
              <div className="absolute -bottom-2 left-6 transform translate-y-1/2">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-background ring-2 ring-muted">
                    <AvatarImage src={avatarPreview || ""} />
                    <AvatarFallback className="text-xl">?</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Label htmlFor="avatar-upload" className="cursor-pointer bg-white/20 backdrop-blur-sm p-1.5 rounded-full hover:bg-white/40 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-10" /> {/* Spacer for avatar overflow */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <RequiredAsterisk /></Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">Username <RequiredAsterisk /></Label>
              <div className="relative">
                <Input
                  id="userName"
                  placeholder="johndoe"
                  required
                  className={userNameStatus === "taken" ? "border-destructive ring-destructive" : userNameStatus === "available" ? "border-green-500" : ""}
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                />
                {userNameStatus === "checking" && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin opacity-50" />
                )}
              </div>
              {userNameError && <p className="text-xs text-destructive mt-1">{userNameError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address <RequiredAsterisk /></Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className={emailStatus === "taken" ? "border-destructive ring-destructive" : emailStatus === "available" ? "border-green-500" : ""}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {emailStatus === "checking" && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin opacity-50" />
                )}
              </div>
              {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password <RequiredAsterisk /></Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <span className={`text-[10px] ${formData.bio.length >= 250 ? "text-destructive" : "text-muted-foreground"}`}>
                {formData.bio.length}/250
              </span>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell us a little about the user..."
              className="resize-none"
              rows={3}
              maxLength={250}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <ProfileTag value={skills} onChange={setSkills} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-6 pb-4">
              <span className="border-b flex-1"></span>
              <div className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                <Label htmlFor="socials">SOCIAL LINKS</Label>
              </div>
              <span className="border-b flex-1"></span>
            </div>

            {socials.map((social, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative flex items-center w-full">
                  <div className="absolute left-3 text-muted-foreground">
                    {(() => {
                      const Icon = getPlatformIcon(social.url);
                      return <Icon size={16} className="size-4" />;
                    })()}
                  </div>

                  <Input
                    type="url"
                    placeholder="https://example.com/username"
                    value={social.url}
                    onChange={(e) => updateSocial(index, e.target.value)}
                    className="flex-1 pl-9"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSocial(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSocial}
              className="gap-2"
            >
              <Plus className="size-4" />
              Add social link
            </Button>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background z-10 pt-4 pb-2 border-t mt-auto">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
