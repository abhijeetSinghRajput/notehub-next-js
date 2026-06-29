"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { LabeledInput } from "@/components/labeled-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, UserRoundPen, LinkIcon } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { UpdateUserProfileData } from "@/types/auth";
import { getPlatformIcon } from "@/lib/platform";
import { validateUsername } from "@/lib/validator";

import axios from "axios";
import ProfileTag from "@/components/profile-tag";
import SectionDivider from "@/components/ui/section-divider";

const ProfileSettingsClient = () => {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState<{ url: string }[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authUser) return;
    setFullName(authUser.fullName || "");
    setUserName(authUser.userName || "");
    setBio(authUser.bio || "");
    setSocials(authUser.socials || []);
    setSkills(authUser.skills || []);
    setUserNameError("");
    setFormError("");
  }, [authUser]);

  if (!authUser) return null;

  const originalSocials = authUser.socials || [];

  const sanitizeSocials = (items: { url: string }[]) =>
    items.map((item) => ({ url: item.url.trim() })).filter((item) => item.url !== "");

  const cleanedSocials = sanitizeSocials(socials);
  const cleanedOriginalSocials = sanitizeSocials(originalSocials);

  const normalizedCurrentFullName = authUser.fullName || "";
  const normalizedCurrentUserName = authUser.userName || "";
  const normalizedCurrentBio = authUser.bio || "";

  const isDirty =
    fullName.trim() !== normalizedCurrentFullName ||
    userName.trim() !== normalizedCurrentUserName ||
    bio.trim() !== normalizedCurrentBio ||
    JSON.stringify(cleanedSocials) !== JSON.stringify(cleanedOriginalSocials) ||
    JSON.stringify(skills) !== JSON.stringify(authUser.skills || []);

  const handleSave = async () => {
    setFormError("");

    const { error: usernameErr } = validateUsername(userName);
    if (usernameErr) {
      setUserNameError(usernameErr);
      return;
    }

    const data: UpdateUserProfileData = {};

    if (fullName.trim() !== normalizedCurrentFullName) data.fullName = fullName.trim();
    if (userName.trim() !== normalizedCurrentUserName) data.userName = userName.trim();
    if (bio.trim() !== normalizedCurrentBio) data.bio = bio.trim();
    if (JSON.stringify(cleanedSocials) !== JSON.stringify(cleanedOriginalSocials))
      data.socials = cleanedSocials;
    if (JSON.stringify(skills) !== JSON.stringify(authUser.skills || []))
      data.skills = skills;

    if (!Object.keys(data).length) return;

    try {
      await updateProfile(data);
      setSocials(cleanedSocials);
      setFormError("");
    } catch (error) {
      let message = "Failed to update profile.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      setFormError(message);
    }
  };

  const handleReset = () => {
    setFullName(normalizedCurrentFullName);
    setUserName(normalizedCurrentUserName);
    setBio(normalizedCurrentBio);
    setSocials(originalSocials);
    setSkills(authUser.skills || []);
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
    <div className="space-y-6">
      <h1 className="sr-only">Profile Settings</h1>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-10 p-4 pt-6 max-w-3xl mx-auto">
        {/* ── BASIC INFO ── */}
        <div className="space-y-4">
          <SectionDivider icon={UserRoundPen} label="BASIC INFO" />

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
              const val = e.target.value;
              setUserName(val);
              const { error } = validateUsername(val);
              setUserNameError(error);
              setFormError("");
            }}
            error={userNameError}
          />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio">Bio</Label>
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/160
              </p>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell people a little about yourself..."
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setFormError("");
              }}
              maxLength={160}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* ── SKILLS ── */}
        <div className="space-y-4">
          <ProfileTag value={skills} onChange={setSkills} />
        </div>

        {/* ── SOCIAL LINKS ── */}
        <div className="space-y-4">
          <SectionDivider icon={LinkIcon} label="SOCIAL LINKS" />

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
      </div>

      {/* ── SAVE BAR ── */}
      {isDirty && (
        <div className="flex items-center bg-background/80 backdrop-blur-sm sticky bottom-0 z-10 justify-end gap-3 p-3 px-4 border-t">
          <Button variant="ghost" onClick={handleReset} disabled={isUpdatingProfile}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdatingProfile}>
            {isUpdatingProfile ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsClient;