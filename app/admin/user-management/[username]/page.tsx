"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { axiosInstance } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Ban, Trash, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import BadgeIcon from "@/components/icons/BadgeIcon";
import type { IUser } from "@/types/model";
import { getPlatformIcon } from "@/lib/platform";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function AdminUserEditPage() {
  const { username } = useParams();
  const router = useRouter();
  const { updateUser, batchUpdateUsers } = useAdminStore();

  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    bio: "",
    socials: [] as { url: string }[],
    role: "user",
    isBanned: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "delete" | "ban" | "unban";
  }>({ isOpen: false, action: "delete" });
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(`/user/${username}`);
        if (res.data) {
          setUser(res.data);
          setFormData({
            fullName: res.data.fullName || "",
            userName: res.data.userName || "",
            bio: res.data.bio || "",
            socials: res.data.socials ? res.data.socials.map((s: { url: string }) => ({ url: s.url })) : [],
            role: res.data.role || "user",
            isBanned: res.data.isBanned || false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        toast.error("User not found");
        router.push("/admin/user-management");
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchUser();
  }, [username, router]);

  const handleSave = async () => {
    if (!user?._id) return;
    setIsSaving(true);

    const payload = {
      ...formData,
      socials: formData.socials.map(s => ({ url: s.url.trim() })).filter(s => s.url)
    };

    const result = await updateUser(user._id, payload);
    if (result.success) {
      toast.success("User updated successfully");
      // Redirect if username changed
      if (formData.userName !== username) {
        router.replace(`/admin/user-management/${formData.userName}`);
      }
    } else {
      toast.error(result.message || "Failed to update user");
    }
    setIsSaving(false);
  };

  const handleDestructiveAction = async () => {
    if (!user?._id) return;
    setIsSaving(true);

    const { action } = confirmDialog;
    const result = await batchUpdateUsers([user._id], action);

    if (result.success) {
      toast.success(`Action ${action} successful`);
      if (action === "delete") {
        router.push("/admin/user-management");
      } else {
        setFormData(prev => ({ ...prev, isBanned: action === "ban" }));
        setConfirmDialog({ isOpen: false, action: "delete" });
      }
    } else {
      toast.error(result.message || "Action failed");
    }

    setIsSaving(false);
  };

  const isConfirmValid = () => {
    if (confirmDialog.action === "delete") return confirmInput.toLowerCase() === "delete";
    if (confirmDialog.action === "ban") return confirmInput.toLowerCase() === "ban";
    return true;
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading user profile...</div>;
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push("/admin/user-management")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="relative size-16 shrink-0 rounded-full bg-muted">
            <Image
              src={user.avatar || "/avatar.svg"}
              alt={user.fullName || "User"}
              fill
              className="object-cover rounded-full"
            />
            {user.role === "admin" && (
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full p-0.5 bg-card">
                <BadgeIcon className="size-5 text-blue-500" />
              </span>
            )}
          </div>
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              {user.fullName}
            </CardTitle>
            <CardDescription>@{user.userName} • {user.email}</CardDescription>
            <div className="flex gap-2 mt-2">
              {formData.isBanned && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <Ban className="w-3 h-3 mr-1" /> Banned
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Social Links</Label>

            {formData.socials.map((social, index) => (
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
                    onChange={(e) => {
                      const newSocials = [...formData.socials];
                      newSocials[index].url = e.target.value;
                      setFormData({ ...formData, socials: newSocials });
                    }}
                    className="flex-1 pl-9"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newSocials = formData.socials.filter((_, i) => i !== index);
                    setFormData({ ...formData, socials: newSocials });
                  }}
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
              onClick={() => setFormData({ ...formData, socials: [...formData.socials, { url: "" }] })}
              className="gap-2"
            >
              <Plus className="size-4" />
              Add social link
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-3">
              <Label>Account Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger>
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
              <div className="flex items-center space-x-2 border rounded-md p-3 justify-between h-10">
                <span className="text-sm font-medium">{formData.isBanned ? "Banned" : "Active"}</span>
                <Switch
                  checked={formData.isBanned}
                  onCheckedChange={(checked) => setFormData({ ...formData, isBanned: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t pt-6">
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => { setConfirmDialog({ isOpen: true, action: "delete" }); setConfirmInput(""); }}>
              <Trash className="w-4 h-4 mr-2" /> Delete Account
            </Button>
            {!formData.isBanned ? (
              <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => { setConfirmDialog({ isOpen: true, action: "ban" }); setConfirmInput(""); }}>
                <Ban className="w-4 h-4 mr-2" /> Ban User
              </Button>
            ) : (
              <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => { setConfirmDialog({ isOpen: true, action: "unban" }); setConfirmInput(""); }}>
                Unban User
              </Button>
            )}
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── CONFIRMATION DIALOG ── */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to <b>{confirmDialog.action}</b> the user @{user.userName}.
              {confirmDialog.action === "delete" && " This action will soft delete the account. They will no longer be visible but their data remains in the database."}
              {confirmDialog.action === "ban" && " This will prevent the user from logging in until unbanned."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(confirmDialog.action === "delete" || confirmDialog.action === "ban") && (
            <div className="my-4">
              <p className="text-sm mb-2">Please type <strong>{confirmDialog.action}</strong> to confirm.</p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type "${confirmDialog.action}"`}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDestructiveAction();
              }}
              disabled={isSaving || !isConfirmValid()}
              className={confirmDialog.action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isSaving ? "Processing..." : "Confirm Action"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
