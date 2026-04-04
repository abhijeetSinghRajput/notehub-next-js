"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LabeledInput } from "@/components/labeled-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import UpdateEmailCard from "@/components/UpdateEmailCard";
import { UpdateUserProfileData } from "@/types/auth";
import { getPlatformIcon } from "@/lib/platform";
import { axiosInstance } from "@/lib/axios";
import axios from "axios";

type EditableUser = {
  _id: string;
  fullName?: string;
  userName?: string;
  bio?: string;
  socials?: { url: string }[];
  email?: string;
  role?: string;
};

const ProfileSettingsClient = () => {
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();

  const [targetUser, setTargetUser] = useState<EditableUser | null>(null);
  const [isFetchingTargetUser, setIsFetchingTargetUser] = useState(false);
  const [isSavingAsAdmin, setIsSavingAsAdmin] = useState(false);

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState<{ url: string }[]>([]);
  const [formError, setFormError] = useState("");

  const isAdmin = authUser?.role === "admin";
  const isEditingOtherUser = Boolean(
    isAdmin && username && authUser?._id && username !== authUser._id,
  );

  const currentProfile = useMemo<EditableUser | null>(() => {
    if (isEditingOtherUser) return targetUser;
    return authUser as EditableUser | null;
  }, [isEditingOtherUser, targetUser, authUser]);

  useEffect(() => {
    const loadTargetUser = async () => {
      if (!authUser) return;

      if (!isEditingOtherUser) {
        setTargetUser(null);
        return;
      }

      try {
        setFormError("");
        setIsFetchingTargetUser(true);

        const { data } = await axiosInstance.get(`/user/${username}`);
        const user = data?.user || data?.data || data;

        setTargetUser(user);
      } catch (error) {
        let message = "Failed to load target user profile.";

        if (axios.isAxiosError(error)) {
          message = error.response?.data?.message || message;
        }

        setFormError(message);
        console.error("Failed to load target user profile:", error);
      } finally {
        setIsFetchingTargetUser(false);
      }
    };

    loadTargetUser();
  }, [authUser, isEditingOtherUser, username]);

  useEffect(() => {
    if (!currentProfile) return;

    setFullName(currentProfile.fullName || "");
    setUserName(currentProfile.userName || "");
    setBio(currentProfile.bio || "");
    setSocials(currentProfile.socials || []);
    setUserNameError("");
    setFormError("");
  }, [currentProfile]);

  const validateUsername = (val: string) => {
    const v = val.trim();
    if (!v) return "Username is required.";
    if (/[A-Z]/.test(v)) return "Only lowercase letters are allowed.";
    if (!/^[a-z0-9-]+$/.test(v))
      return "Only letters, numbers, and hyphens are allowed.";
    if (v.startsWith("-")) return "Username cannot start with a hyphen.";
    if (v.endsWith("-")) return "Username cannot end with a hyphen.";
    if (v.includes("--")) return "Consecutive hyphens are not allowed.";
    if (v.length > 39) return "Username cannot be longer than 39 characters.";
    return "";
  };

  const sanitizeSocials = (items: { url: string }[]) => {
    return items
      .map((item) => ({ url: item.url.trim() }))
      .filter((item) => item.url !== "");
  };

  if (!authUser) return null;

  if (isEditingOtherUser && isFetchingTargetUser) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!currentProfile) return null;

  const originalSocials = currentProfile.socials || [];
  const cleanedSocials = sanitizeSocials(socials);
  const cleanedOriginalSocials = sanitizeSocials(originalSocials);

  const normalizedCurrentUserName = currentProfile.userName || "";
  const normalizedCurrentFullName = currentProfile.fullName || "";
  const normalizedCurrentBio = currentProfile.bio || "";

  const isDirty =
    fullName.trim() !== normalizedCurrentFullName ||
    userName.trim() !== normalizedCurrentUserName ||
    bio.trim() !== normalizedCurrentBio ||
    JSON.stringify(cleanedSocials) !== JSON.stringify(cleanedOriginalSocials);

  const isSaving = isUpdatingProfile || isSavingAsAdmin;

  const handleSave = async () => {
    setFormError("");

    const usernameErr = validateUsername(userName);
    if (usernameErr) {
      setUserNameError(usernameErr);
      return;
    }

    const data: UpdateUserProfileData = {};

    if (fullName.trim() !== normalizedCurrentFullName) {
      data.fullName = fullName.trim();
    }

    if (userName.trim() !== normalizedCurrentUserName) {
      data.userName = userName.trim();
    }

    if (bio.trim() !== normalizedCurrentBio) {
      data.bio = bio.trim();
    }

    if (JSON.stringify(cleanedSocials) !== JSON.stringify(cleanedOriginalSocials)) {
      data.socials = cleanedSocials;
    }

    if (!Object.keys(data).length) return;

    try {
      if (isEditingOtherUser && targetUser) {
        setIsSavingAsAdmin(true);

        const { data: response } = await axiosInstance.patch(
          `/admin/users/${targetUser._id}`,
          data,
        );

        const updatedUser =
          response?.user ||
          response?.updatedUser ||
          response?.data ||
          { ...currentProfile, ...data };

        setTargetUser((prev) => ({
          ...(prev || currentProfile),
          ...updatedUser,
        }));
      } else {
        await updateProfile(data);
      }

      setSocials(cleanedSocials);
      setFormError("");
    } catch (error) {
      let message = "Failed to update profile.";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }

      setFormError(message);
      console.error("Failed to update profile:", error);
    } finally {
      setIsSavingAsAdmin(false);
    }
  };

  const handleReset = () => {
    setFullName(normalizedCurrentFullName);
    setUserName(normalizedCurrentUserName);
    setBio(normalizedCurrentBio);
    setSocials(originalSocials);
    setUserNameError("");
    setFormError("");
  };

  const addSocial = () => setSocials((prev) => [...prev, { url: "" }]);

  const updateSocial = (index: number, url: string) => {
    setSocials((prev) => prev.map((s, i) => (i === index ? { url } : s)));
    setFormError("");
  };

  const removeSocial = (index: number) => {
    setSocials((prev) => prev.filter((_, i) => i !== index));
    setFormError("");
  };

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditingOtherUser ? "Edit User Profile" : "Profile Information"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {isEditingOtherUser
              ? "Admin mode: edit this user's name, username, bio, and social links."
              : "Edit your name, username, bio, and social links."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <LabeledInput
              id="fullName"
              label="Full Name"
              type="text"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFormError("");
              }}
            />

            <LabeledInput
              id="userName"
              label="Username"
              type="text"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setUserNameError(validateUsername(e.target.value));
                setFormError("");
              }}
              error={userNameError}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people a little about yourself..."
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setFormError("");
              }}
              maxLength={300}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/300
            </p>
          </div>

          <div className="space-y-3">
            <Label>Social Links</Label>

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
                    placeholder="https://github.com/username"
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

          {isDirty && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t">
              <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
                Cancel
              </Button>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditingOtherUser && <UpdateEmailCard />}
    </div>
  );
};

export default ProfileSettingsClient;