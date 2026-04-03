"use client";
import { useState, useEffect } from "react";
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
import { LinkIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import UpdateEmailCard from "@/components/UpdateEmailCard";
import { UpdateUserProfileData } from "@/types/auth";
import { getPlatformIcon } from "@/lib/platform";

const Profile = () => {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState<{ url: string }[]>([]);

  useEffect(() => {
    if (authUser) {
      setFullName(authUser.fullName || "");
      setUserName(authUser.userName || "");
      setBio(authUser.bio || "");
      setSocials(authUser.socials || []);
    }
  }, [authUser]);

  if (!authUser) return null;

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

  const isDirty =
    fullName.trim() !== authUser.fullName ||
    userName.trim() !== authUser.userName ||
    bio.trim() !== (authUser.bio || "") ||
    JSON.stringify(socials) !== JSON.stringify(authUser.socials || []);

  const handleSave = async () => {
    const usernameErr = validateUsername(userName);
    if (usernameErr) {
      setUserNameError(usernameErr);
      return;
    }

    const data: UpdateUserProfileData = {};
    if (fullName.trim() !== authUser.fullName) data.fullName = fullName.trim();
    if (userName.trim() !== authUser.userName) data.userName = userName.trim();
    if (bio.trim() !== (authUser.bio || "")) data.bio = bio.trim();
    if (JSON.stringify(socials) !== JSON.stringify(authUser.socials || []))
      data.socials = socials;

    await updateProfile(data);
  };

  const handleReset = () => {
    setFullName(authUser.fullName || "");
    setUserName(authUser.userName || "");
    setBio(authUser.bio || "");
    setSocials(authUser.socials || []);
    setUserNameError("");
  };

  const addSocial = () => setSocials((prev) => [...prev, { url: "" }]);

  const updateSocial = (index: number, url: string) => {
    setSocials((prev) => prev.map((s, i) => (i === index ? { url } : s)));
  };

  const removeSocial = (index: number) => {
    setSocials((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Edit your name, username, bio, and social links.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name & Username */}
          <div className="space-y-4">
            <LabeledInput
              id="fullName"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <LabeledInput
              id="userName"
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setUserNameError(validateUsername(e.target.value));
              }}
              error={userNameError}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people a little about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/300
            </p>
          </div>

          {/* Socials */}
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
              variant="outline"
              size="sm"
              onClick={addSocial}
              className="gap-2"
            >
              <Plus className="size-4" />
              Add social link
            </Button>
          </div>

          {/* Actions */}
          {isDirty && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t">
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={isUpdatingProfile}
              >
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
        </CardContent>
      </Card>

      <UpdateEmailCard />
    </div>
  );
};

export default Profile;
