"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { getPlatformIcon } from "@/lib/platform";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { validateUsername } from "@/lib/validator";
import ProfileTag from "@/components/profile-tag";

interface ProfileTabProps {
  formData: {
    fullName: string;
    userName: string;
    bio: string;
    socials: { url: string }[];
    role: "user" | "admin";
    isBanned: boolean;
    skills: string[];
  };
  setFormData: React.Dispatch<
    React.SetStateAction<ProfileTabProps["formData"]>
  >;
  usernameError: string;
  setUsernameError: React.Dispatch<React.SetStateAction<string>>;
  isSelf: boolean;
}

const ProfileTab = ({
  formData,
  setFormData,
  usernameError,
  setUsernameError,
  isSelf,
}: ProfileTabProps) => {
  return (
    <>
      <div className="stripe-divider" />
      <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
        Basic Info
      </h2>
      {/* BASIC INFO */}
      <div className="px-4 py-6 screen-line-bottom">
        <div className="gap-4 grid sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="bg-muted/30 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              value={formData.userName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, userName: val });
                const { error } = validateUsername(val);
                setUsernameError(error);
              }}
              className={cn(
                "bg-muted/30 focus:bg-background transition-colors",
                usernameError &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {usernameError && (
              <p className="slide-in-from-top-1 text-[10px] text-destructive animate-in fade-in">
                {usernameError}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Bio</Label>
            <p className="text-[10px] text-muted-foreground text-right">
              {formData.bio.length}/160
            </p>
          </div>
          <Textarea
            id="bio"
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            maxLength={160}
            className="bg-muted/30 focus:bg-background transition-colors resize-none"
          />
        </div>

        <div className="mt-4">
          <ProfileTag
            value={formData.skills}
            onChange={(skills) => setFormData({ ...formData, skills })}
          />
        </div>
      </div>

      {/* SOCIAL LINKS */}
      <div className="stripe-divider" />
      <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
        SOCIAL LINKS
      </h2>

      <div className="space-y-4 px-4 py-6 screen-line-bottom">
        {formData.socials.map((social: { url: string }, index: number) => (
          <div
            key={index}
            className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in"
          >
            <div className="relative flex items-center w-full">
              <div className="left-3 absolute text-muted-foreground">
                {(() => {
                  const Icon = getPlatformIcon(social.url);
                  return <Icon size={16} className="size-4" />;
                })()}
              </div>

              <Input
                type="url"
                placeholder="https://example.com/username"
                value={social.url}
                onChange={(e) => {
                  const newSocials = [...formData.socials];
                  newSocials[index].url = e.target.value;
                  setFormData({ ...formData, socials: newSocials });
                }}
                className="flex-1 bg-muted/30 focus:bg-background pl-9 transition-colors"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newSocials = formData.socials.filter(
                  (_: any, i: number) => i !== index,
                );
                setFormData({ ...formData, socials: newSocials });
              }}
              className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setFormData({
              ...formData,
              socials: [...formData.socials, { url: "" }],
            })
          }
          className="gap-2 border-dashed"
        >
          <Plus className="size-4" />
          Add social link
        </Button>
      </div>

      {/* ACCOUNT SETTINGS */}

      <div className="stripe-divider" />
      <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
        ACCOUNT SETTINGS
      </h2>
      <div className="screen-line-top px-4 py-6">
        <div className="gap-4 grid grid-cols-2">
          <div className="space-y-3">
            <Label>Account Role</Label>
            <Select
              disabled={isSelf}
              value={formData.role}
              onValueChange={(val: "user" | "admin") =>
                setFormData({ ...formData, role: val })
              }
            >
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Standard User</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Account Status</Label>
            <div
              onClick={() =>
                setFormData({
                  ...formData,
                  isBanned: !formData.isBanned,
                })
              }
              className="flex justify-between items-center bg-background hover:bg-accent dark:bg-input/30 dark:hover:bg-input/50 shadow-xs p-3 border border-input rounded-md w-full h-10 transition-colors hover:text-accent-foreground cursor-pointer"
            >
              <span className="font-medium text-sm">
                {formData.isBanned ? "Banned" : "Active"}
              </span>
              <Switch
                disabled={isSelf}
                checked={formData.isBanned}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isBanned: checked })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileTab;
