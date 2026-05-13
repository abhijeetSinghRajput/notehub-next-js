"use client";
import Link from "next/link";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { axiosInstance } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Ban, Trash, Plus, Trash2, LinkIcon, User2Icon, UserPen, UserRoundPen, ShieldCheck, Monitor, Smartphone, MapPin, Clock, KeyRound, LogOut, Loader2, Image as ImageIcon, Camera, ArrowUpRight, UserIcon, Mail, Hash } from "lucide-react";
import imageCompression from "browser-image-compression";
import ImageCropperModal from "@/components/ImageCropperModal";
import ImageLightbox from "@/components/ImageLightbox";
import Image from "next/image";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { Skeleton } from "@/components/ui/skeleton";
import type { IUser } from "@/types/model";
import { getPlatformIcon } from "@/lib/platform";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { validateUsername } from "@/lib/validator";


export default function AdminUserEditPage() {
  const { username } = useParams();
  const router = useRouter();
  const {
    updateUser,
    batchUpdateUsers,
    fetchUserByUsername,
    isLoadingUsers,
    singleUserCache,
    fetchUserSessions,
    terminateSession,
    terminateAllSessions,
    updateUserPassword,
    uploadUserAvatar,
    removeUserAvatar,
    uploadUserCover,
    removeUserCover,
  } = useAdminStore();

  const cachedUser = singleUserCache[username as string]?.data;
  const [user, setUser] = useState<IUser | null>(cachedUser || null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure the DOM is updated
    const timer = setTimeout(() => {
      const activeTabElement = tabsListRef.current?.querySelector('[data-state="active"]');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isTerminatingSession, setIsTerminatingSession] = useState<string | null>(null);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);

  const [formData, setFormData] = useState({
    fullName: cachedUser?.fullName || "",
    userName: cachedUser?.userName || "",
    bio: cachedUser?.bio || "",
    socials: cachedUser?.socials ? cachedUser.socials.map((s: { url: string }) => ({ url: s.url })) : [],
    role: cachedUser?.role || "user",
    isBanned: cachedUser?.isBanned || false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");


  // Photo state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRemovingCover, setIsRemovingCover] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperMode, setCropperMode] = useState<"avatar" | "cover" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  const COVER_ASPECT = 767 / 192;

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "delete" | "ban" | "unban";
  }>({ isOpen: false, action: "delete" });
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const data = await fetchUserByUsername(username as string);
      if (data) {
        setUser(data);
        setFormData({
          fullName: data.fullName || "",
          userName: data.userName || "",
          bio: data.bio || "",
          socials: data.socials ? data.socials.map((s: { url: string }) => ({ url: s.url })) : [],
          role: data.role || "user",
          isBanned: data.isBanned || false,
        });
      } else if (!cachedUser) {
        toast.error("User not found");
        router.push("/admin/user-management");
      }
    };
    if (username) fetchUser();
  }, [username, router, fetchUserByUsername, cachedUser]);

  useEffect(() => {
    const loadSessions = async () => {
      if (user?._id) {
        const data = await fetchUserSessions(user._id as string);
        setSessions(data);
      }
    };
    loadSessions();
  }, [user?._id, fetchUserSessions]);

  const handleTerminateSession = async (sid: string) => {
    const userId = user?._id;
    if (!userId) return;
    setIsTerminatingSession(sid);
    const success = await terminateSession(userId, sid);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));
    }
    setIsTerminatingSession(null);
  };

  const handleTerminateAll = async () => {
    const userId = user?._id;
    if (!userId) return;
    setIsTerminatingAll(true);
    const success = await terminateAllSessions(userId);
    if (success) {
      setSessions([]);
    }
    setIsTerminatingAll(false);
  };

  const handlePasswordUpdate = async () => {
    const userId = user?._id;
    if (!userId || !newPassword) return;
    setIsUpdatingPassword(true);
    const success = await updateUserPassword(userId, newPassword);
    if (success) {
      setNewPassword("");
    }
    setIsUpdatingPassword(false);
  };

  const handleSave = async () => {
    const userId = user?._id;
    if (!userId) return;

    const { error } = validateUsername(formData.userName);
    if (error) {
      setUsernameError(error);
      toast.error(error);
      return;
    }

    setIsSaving(true);


    const payload = {
      ...formData,
      socials: formData.socials.map((s: { url: string }) => ({ url: s.url.trim() })).filter((s: { url: string }) => s.url)
    };

    const result = await updateUser(userId, payload);
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
    const userId = user?._id;
    if (!userId) return;
    setIsSaving(true);

    const { action } = confirmDialog;
    const result = await batchUpdateUsers([userId], action);

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

  // ── Photo handlers ──────────────────────────────────────────────────────────
  const openCropper = (file: File, mode: "avatar" | "cover") => {
    const url = URL.createObjectURL(file);
    setCropperSrc(url);
    setCropperMode(mode);
  };

  const closeCropper = useCallback(() => {
    if (cropperSrc) URL.revokeObjectURL(cropperSrc);
    setCropperSrc(null);
    setCropperMode(null);
  }, [cropperSrc]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, mode);
    e.target.value = "";
  };

  const handleCropConfirmed = useCallback(async (blob: Blob) => {
    const userId = user?._id as string;
    const mode = cropperMode;
    closeCropper();
    if (!userId || !mode) return;

    try {
      let file = new File([blob], mode === "avatar" ? "avatar.jpg" : "cover.jpg", { type: "image/jpeg" });
      if (file.size > 800 * 1024) {
        file = (await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: mode === "cover" ? 1534 : 1024,
          useWebWorker: true,
        })) as File;
      }
      if (mode === "avatar") {
        setIsUploadingAvatar(true);
        const res = await uploadUserAvatar(userId, file);
        if (res.success && res.user) setUser(res.user);
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingCover(true);
        const res = await uploadUserCover(userId, file);
        if (res.success && res.user) setUser(res.user);
        setIsUploadingCover(false);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setIsUploadingAvatar(false);
      setIsUploadingCover(false);
    }
  }, [cropperMode, closeCropper, user?._id, uploadUserAvatar, uploadUserCover]);

  const handleRemoveAvatar = async () => {
    const userId = user?._id as string;
    if (!userId) return;
    setIsRemovingAvatar(true);
    const res = await removeUserAvatar(userId);
    if (res.success && res.user) setUser(res.user);
    setIsRemovingAvatar(false);
  };

  const handleRemoveCover = async () => {
    const userId = user?._id as string;
    if (!userId) return;
    setIsRemovingCover(true);
    const res = await removeUserCover(userId);
    if (res.success && res.user) setUser(res.user);
    setIsRemovingCover(false);
  };


  if (isLoadingUsers && !user) {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!user && !isLoadingUsers) return null;

  return (
    <>
      <Card className="overflow-hidden">
        {/* Image Cropper Modal */}
        {cropperSrc && cropperMode && (
          <ImageCropperModal
            src={cropperSrc}
            aspect={cropperMode === "avatar" ? 1 : COVER_ASPECT}
            circular={cropperMode === "avatar"}
            label={cropperMode === "avatar" ? "Crop Profile Photo" : "Crop Cover Photo"}
            onConfirm={handleCropConfirmed}
            onClose={closeCropper}
          />
        )}
        {/* COVER PHOTO */}
        <button
          onClick={() => user?.cover && setSelectedLightboxImage(user.cover)}
          className="relative w-full aspect-4/1 bg-muted/30 overflow-hidden group/cover cursor-zoom-in"
          aria-label="View cover photo"
        >
          <Image
            src={user?.cover || "/placeholder.svg"}
            alt="Cover"
            fill
            sizes="100vw"
            className={cn("object-cover transition-transform duration-500 group-hover/cover:scale-105", !user?.cover && "opacity-20")}
            priority
          />
          {user?.cover && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
              <Plus className="size-8 text-white/80" />
            </div>
          )}
        </button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="relative border-b pb-0! pt-0">
            <div className="flex flex-col gap-6 px-1 pb-6">
              <div className="relative w-min -mt-12 sm:-mt-16">
                <button
                  onClick={() => user?.avatar && setSelectedLightboxImage(user.avatar)}
                  className="relative size-24 sm:size-32 rounded-full overflow-hidden border-4 border-card bg-muted shadow-lg group/avatar cursor-zoom-in"
                  aria-label="View profile photo"
                >
                  <Image src={user?.avatar || "/avatar.svg"} alt={user?.fullName || "User"} fill sizes="(max-width: 640px) 96px, 128px" className="object-cover transition-transform group-hover/avatar:scale-110" priority />
                  {user?.avatar && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="size-6 text-white" />
                    </div>
                  )}
                </button>
                {user?.role === "admin" && (
                  <span className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full p-1 bg-card">
                    <BadgeIcon className="size-5 text-blue-500" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <CardTitle className="text-2xl font-bold truncate mb-3">
                  {user?.fullName}
                </CardTitle>
                <CardDescription className="text-base flex flex-col space-y-2">
                  <Link
                    href={`/${user?.userName}`}
                    className="flex items-center gap-2 hover:underline underline-offset-4 group transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                      <User2Icon />
                    </div>
                    @{user?.userName}
                    <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                      <Mail />
                    </div>
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                      <Hash />
                    </div>
                    {user?._id}
                  </div>
                </CardDescription>

                <div className="flex flex-wrap gap-2 mt-4">
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user?.isBanned ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                    {user?.isBanned ? "Banned" : "Active Account"}
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-100">
                    {user?.role === "admin" ? "Administrator" : "Standard User"}
                  </div>
                </div>
              </div>
            </div>

            <TabsList
              ref={tabsListRef}
              variant="line"
              className="w-full justify-start h-12 -mb-px overflow-x-auto flex-nowrap scrollbar-hide overflow-y-hidden"
              style={{ willChange: "scroll-position" }}
            >
              <TabsTrigger value="profile" className="px-6 py-3 data-[state=active]:bg-transparent">
                <User2Icon className="size-4 mr-2" />
                Profile Info
              </TabsTrigger>
              <TabsTrigger value="photos" className="px-6 py-3 data-[state=active]:bg-transparent">
                <Camera className="size-4 mr-2" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="security" className="px-6 py-3 data-[state=active]:bg-transparent">
                <ShieldCheck className="size-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-8 px-6">
            <TabsContent value="profile" className="space-y-10 mt-0 focus-visible:ring-0">
              {/* BASIC INFO */}
              <div>
                <div className="flex items-center gap-6 pb-4 ">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <UserRoundPen className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">BASIC INFO</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                        usernameError && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {usernameError && (
                      <p className="text-[10px] text-destructive animate-in fade-in slide-in-from-top-1">
                        {usernameError}
                      </p>
                    )}

                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={250}
                    className="resize-none bg-muted/30 focus:bg-background transition-colors"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {formData.bio.length}/250 characters
                  </p>
                </div>
              </div>

              {/* SOCIAL LINKS */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 pb-4 ">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">SOCIAL LINKS</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>

                {formData.socials.map((social: { url: string }, index: number) => (
                  <div key={index} className="flex items-center gap-2 group animate-in fade-in slide-in-from-left-2 duration-200">
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
                        onChange={(e) => {
                          const newSocials = [...formData.socials];
                          newSocials[index].url = e.target.value;
                          setFormData({ ...formData, socials: newSocials });
                        }}
                        className="flex-1 pl-9 bg-muted/30 focus:bg-background transition-colors"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newSocials = formData.socials.filter((_: any, i: number) => i !== index);
                        setFormData({ ...formData, socials: newSocials });
                      }}
                      className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                  className="gap-2 border-dashed"
                >
                  <Plus className="size-4" />
                  Add social link
                </Button>
              </div>

              {/* ACCOUNT SETTINGS */}
              <div>
                <div className="flex items-center gap-6 pb-4 ">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <UserRoundPen className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ACCOUNT SETTINGS</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Account Role</Label>
                    <Select value={formData.role} onValueChange={(val: "user" | "admin") => setFormData({ ...formData, role: val })}>
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
                      className="cursor-pointer flex h-10 w-full items-center justify-between rounded-md border border-input bg-background p-3 shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50"
                    >
                      <span className="text-sm font-medium">{formData.isBanned ? "Banned" : "Active"}</span>
                      <Switch
                        checked={formData.isBanned}
                        onCheckedChange={(checked) => setFormData({ ...formData, isBanned: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── PHOTOS TAB ── */}
            <TabsContent value="photos" className="space-y-10 mt-0 focus-visible:ring-0">
              {/* AVATAR */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 pb-4">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Profile Photo</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>
                <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                  <div className="relative size-36 shrink-0">
                    <button
                      onClick={() => user?.avatar && setSelectedLightboxImage(user.avatar)}
                      className="size-36 rounded-full overflow-hidden border-4 border-card bg-muted shadow-md group/avatarmain cursor-zoom-in relative block"
                      aria-label="View profile photo"
                    >
                      <Image src={user?.avatar || "/avatar.svg"} alt={user?.fullName || "Avatar"} fill sizes="144px" className="object-cover transition-transform group-hover/avatarmain:scale-105" />
                      {user?.avatar && (
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatarmain:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="size-8 text-white/80" />
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Square profile photo · at least 400 × 400 px</p>
                      <p className="text-muted-foreground text-sm">The image will be cropped to a square. Used on profile pages and comments.</p>
                    </div>
                    <div className="flex gap-2">
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" disabled={isUploadingAvatar} onChange={(e) => handlePhotoFileChange(e, "avatar")} />
                      <Button variant="default" size="sm" className="w-32" disabled={isUploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
                        {isUploadingAvatar ? <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Uploading…</> : "Upload Photo"}
                      </Button>
                      <Button size="icon" variant="secondary" className="size-9" disabled={isRemovingAvatar || !user?.avatar} onClick={handleRemoveAvatar}>
                        {isRemovingAvatar ? <Loader2 className="animate-spin size-4" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* COVER */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 pb-4">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Cover Photo</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>
                <div className="flex flex-col gap-5">
                  <button
                    onClick={() => user?.cover && setSelectedLightboxImage(user.cover)}
                    className="relative w-full aspect-4/1 rounded-xl overflow-hidden bg-muted/30 group/covermain cursor-zoom-in"
                    aria-label="View cover photo"
                  >
                    <Image
                      src={user?.cover || "/placeholder.svg"}
                      alt="Cover"
                      fill
                      className={cn("object-cover transition-transform duration-500 group-hover/covermain:scale-105", !user?.cover && "opacity-20")}
                      sizes="100vw"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    {user?.cover && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/covermain:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="size-10 text-white/70" />
                      </div>
                    )}
                  </button>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Cover banner · 767 × 192 px (auto-cropped)</p>
                      <p className="text-muted-foreground text-sm">Shown as the background banner on this user&apos;s profile page.</p>
                    </div>
                    <div className="flex gap-2">
                      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" disabled={isUploadingCover} onChange={(e) => handlePhotoFileChange(e, "cover")} />
                      <Button variant="default" size="sm" className="w-32" disabled={isUploadingCover} onClick={() => coverInputRef.current?.click()}>
                        {isUploadingCover ? <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Uploading…</> : "Upload Cover"}
                      </Button>
                      <Button size="icon" variant="secondary" className="size-9" disabled={isRemovingCover || !user?.cover} onClick={handleRemoveCover}>
                        {isRemovingCover ? <Loader2 className="animate-spin size-4" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-10 mt-0 focus-visible:ring-0">
              {/* ACTIVE SESSIONS */}
              <div>
                <div className="flex items-center gap-6 pb-4 ">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ACTIVE SESSIONS</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Connected Devices ({sessions.length})</p>
                    {sessions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTerminateAll}
                        disabled={isTerminatingAll}
                        className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isTerminatingAll ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <LogOut className="size-3 mr-1.5" />}
                        Logout all other devices
                      </Button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="py-12 text-center border rounded-xl border-dashed bg-muted/20">
                      <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                        <Monitor className="size-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No active sessions found for this user.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {sessions.map((s) => (
                        <div key={s.sessionId} className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card transition-colors group">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-background transition-colors">
                            {s.deviceName.toLowerCase().includes("mobile") || s.deviceName.toLowerCase().includes("phone") || s.deviceName.toLowerCase().includes("android") || s.deviceName.toLowerCase().includes("iphone") ? (
                              <Smartphone className="size-5 text-muted-foreground" />
                            ) : (
                              <Monitor className="size-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">{s.deviceName}</p>
                              {s.isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-bold text-green-700 dark:text-green-400">Current</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                              <span className="flex items-center text-[11px] text-muted-foreground">
                                <MapPin className="size-3 mr-1 opacity-70" /> {s.location}
                              </span>
                              <span className="flex items-center text-[11px] text-muted-foreground">
                                <Clock className="size-3 mr-1 opacity-70" /> {new Date(s.lastActiveAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={isTerminatingSession === s.sessionId}
                            onClick={() => handleTerminateSession(s.sessionId)}
                          >
                            {isTerminatingSession === s.sessionId ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <LogOut className="size-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECURITY SETTINGS */}
              <div>
                <div className="flex items-center gap-6 pb-4 ">
                  <span className="border-b flex-1"></span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">SECURITY SETTINGS</Label>
                  </div>
                  <span className="border-b flex-1"></span>
                </div>

                <div className="p-6 rounded-xl border bg-card/50 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-4 text-muted-foreground" />
                      <Label htmlFor="newPassword">Reset User Password</Label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new secure password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 bg-background"
                      />
                      <Button
                        variant="secondary"
                        disabled={!newPassword || newPassword.length < 6 || isUpdatingPassword}
                        onClick={handlePasswordUpdate}
                        className="shadow-sm"
                      >
                        {isUpdatingPassword ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                        Update Password
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Requirement: Minimum 6 characters. We recommend a mix of uppercase, numbers, and symbols.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t p-6 gap-4 bg-muted/10">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => { setConfirmDialog({ isOpen: true, action: "delete" }); setConfirmInput(""); }}
              className="w-full sm:w-auto shadow-sm"
            >
              <Trash className="w-4 h-4 mr-2" /> Delete Account
            </Button>
            {!formData.isBanned ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto border-orange-200 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => { setConfirmDialog({ isOpen: true, action: "ban" }); setConfirmInput(""); }}
              >
                <Ban className="w-4 h-4 mr-2" /> Ban User
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={() => { setConfirmDialog({ isOpen: true, action: "unban" }); setConfirmInput(""); }}
              >
                Unban User
              </Button>
            )}
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto shadow-md">
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* ── CONFIRMATION DIALOG ── */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to <b>{confirmDialog.action}</b> the user @{user?.userName}.
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
                className="focus:ring-destructive/20"
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
      {selectedLightboxImage && (
        <ImageLightbox
          src={selectedLightboxImage}
          onClose={() => setSelectedLightboxImage(null)}
        />
      )}
    </>
  );
}
