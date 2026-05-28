"use client";
import Link from "next/link";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
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
import ProfileTag from "@/components/profile-tag";
import { devicons } from "@/data/dev-icons";
import { Badge } from "@/components/ui/badge";


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

  const { authUser } = useAuthStore();

  const cachedUser = singleUserCache[username as string]?.data;
  const [user, setUser] = useState<IUser | null>(cachedUser || null);
  const isSelf = authUser?._id === user?._id;
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
    skills: cachedUser?.skills || [],
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
          skills: data.skills || [],
        });
      } else if (!cachedUser) {
        toast.error("User not found");
        router.push("/admin/users");
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
      if (result.user) {
        setUser(result.user);
      }
      // Redirect if username changed
      if (formData.userName !== username) {
        router.replace(`/admin/users/${formData.userName}`);
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
        router.push("/admin/users");
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
            <Skeleton className="rounded-full size-16" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-48 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="w-full h-4" />
              <div className="gap-4 grid grid-cols-2">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
              </div>
              <Skeleton className="w-full h-20" />
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
          className="group/cover relative bg-muted/30 w-full aspect-4/1 overflow-hidden cursor-zoom-in"
          aria-label="View cover photo"
        >
          <Image
            src={user?.cover || "/placeholder.svg"}
            alt="Cover"
            fill
            sizes="100vw"
            className={cn("object-cover group-hover/cover:scale-105 transition-transform duration-500", !user?.cover && "opacity-20")}
            priority
          />
          {user?.cover && (
            <div className="absolute inset-0 flex justify-center items-center bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity">
              <Plus className="size-8 text-white/80" />
            </div>
          )}
        </button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="relative pt-0 pb-0! border-b">
            <div className="flex flex-col gap-6 px-1 pb-6">
              <div className="relative -mt-12 sm:-mt-16 w-min">
                <button
                  onClick={() => user?.avatar && setSelectedLightboxImage(user.avatar)}
                  className="group/avatar relative bg-muted shadow-lg border-4 border-card rounded-full size-24 sm:size-32 overflow-hidden cursor-zoom-in"
                  aria-label="View profile photo"
                >
                  <Image src={user?.avatar || "/avatar.svg"} alt={user?.fullName || "User"} fill sizes="(max-width: 640px) 96px, 128px" className="object-cover group-hover/avatar:scale-110 transition-transform" priority />
                  {user?.avatar && (
                    <div className="absolute inset-0 flex justify-center items-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <Plus className="size-6 text-white" />
                    </div>
                  )}
                </button>
                {user?.role === "admin" && (
                  <span className="right-1 bottom-1 absolute flex justify-center items-center bg-card p-1 rounded-full size-7">
                    <BadgeIcon className="size-5 text-blue-500" />
                  </span>
                )}
              </div>
              <div className="flex-1 pb-1 min-w-0">
                <CardTitle className="mb-3 font-bold text-2xl truncate">
                  {user?.fullName}
                </CardTitle>
                <CardDescription className="flex flex-col space-y-2 text-base">
                  <Link
                    href={`/${user?.userName}`}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                      <User2Icon />
                    </div>
                    @{user?.userName}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
                  {isSelf && (
                    <div className="bg-purple-50 px-2.5 py-0.5 border border-purple-100 rounded-full font-bold text-[10px] text-purple-700 uppercase tracking-wider">
                      Viewing Your Profile
                    </div>
                  )}
                </div>

                {user?.skills && user.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {user.skills.map((skill) => {
                      const devicon = devicons[skill.toLowerCase() as keyof typeof devicons];
                      return (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="rounded-md h-6 transition-all duration-200 shrink-0"
                        >
                          <img
                            src={devicon?.icon || `/devicons/${skill}.svg`}
                            alt={skill}
                            width={12}
                            height={12}
                            className={cn("shrink-0", devicon?.isInverted && "devicon-invertible dark:invert")}
                          />
                          <span>{skill}</span>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <TabsList
              ref={tabsListRef}
              variant="line"
              className="flex-nowrap justify-start -mb-px w-full h-12 overflow-x-auto overflow-y-hidden scrollbar-hide"
              style={{ willChange: "scroll-position" }}
            >
              <TabsTrigger value="profile" className="data-[state=active]:bg-transparent px-6 py-3">
                <User2Icon className="mr-2 size-4" />
                Profile Info
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-transparent px-6 py-3">
                <Camera className="mr-2 size-4" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-transparent px-6 py-3">
                <ShieldCheck className="mr-2 size-4" />
                Security
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="px-6 pt-8">
            <TabsContent value="profile" className="space-y-10 mt-0 focus-visible:ring-0">
              {/* BASIC INFO */}
              <div>
                <div className="flex items-center gap-6 pb-4">
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <UserRoundPen className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">BASIC INFO</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>

                <div className="gap-4 grid sm:grid-cols-2">
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
                      <p className="slide-in-from-top-1 text-[10px] text-destructive animate-in fade-in">
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
                    className="bg-muted/30 focus:bg-background transition-colors resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {formData.bio.length}/250 characters
                  </p>
                </div>

                <div className="mt-4">
                  <ProfileTag
                    value={formData.skills}
                    onChange={(skills) => setFormData({ ...formData, skills })}
                  />
                </div>
              </div>

              {/* SOCIAL LINKS */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 pb-4">
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">SOCIAL LINKS</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>

                {formData.socials.map((social: { url: string }, index: number) => (
                  <div key={index} className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in">
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
                        const newSocials = formData.socials.filter((_: any, i: number) => i !== index);
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
                  onClick={() => setFormData({ ...formData, socials: [...formData.socials, { url: "" }] })}
                  className="gap-2 border-dashed"
                >
                  <Plus className="size-4" />
                  Add social link
                </Button>
              </div>

              {/* ACCOUNT SETTINGS */}
              <div>
                <div className="flex items-center gap-6 pb-4">
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <UserRoundPen className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">ACCOUNT SETTINGS</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-3">
                    <Label>Account Role</Label>
                    <Select disabled={isSelf} value={formData.role} onValueChange={(val: "user" | "admin") => setFormData({ ...formData, role: val })}>
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
                      <span className="font-medium text-sm">{formData.isBanned ? "Banned" : "Active"}</span>
                      <Switch
                        disabled={isSelf}
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
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">Profile Photo</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>
                <div className="flex sm:flex-row flex-col items-start sm:items-center gap-8">
                  <div className="relative size-36 shrink-0">
                    <button
                      onClick={() => user?.avatar && setSelectedLightboxImage(user.avatar)}
                      className="group/avatarmain block relative bg-muted shadow-md border-4 border-card rounded-full size-36 overflow-hidden cursor-zoom-in"
                      aria-label="View profile photo"
                    >
                      <Image src={user?.avatar || "/avatar.svg"} alt={user?.fullName || "Avatar"} fill sizes="144px" className="object-cover group-hover/avatarmain:scale-105 transition-transform" />
                      {user?.avatar && (
                        <div className="absolute inset-0 flex justify-center items-center bg-black/30 opacity-0 group-hover/avatarmain:opacity-100 transition-opacity">
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
                        {isUploadingAvatar ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Uploading…</> : "Upload Photo"}
                      </Button>
                      <Button size="icon" variant="secondary" className="size-9" disabled={isRemovingAvatar || !user?.avatar} onClick={handleRemoveAvatar}>
                        {isRemovingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* COVER */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 pb-4">
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">Cover Photo</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>
                <div className="flex flex-col gap-5">
                  <button
                    onClick={() => user?.cover && setSelectedLightboxImage(user.cover)}
                    className="group/covermain relative bg-muted/30 rounded-xl w-full aspect-4/1 overflow-hidden cursor-zoom-in"
                    aria-label="View cover photo"
                  >
                    <Image
                      src={user?.cover || "/placeholder.svg"}
                      alt="Cover"
                      fill
                      className={cn("object-cover group-hover/covermain:scale-105 transition-transform duration-500", !user?.cover && "opacity-20")}
                      sizes="100vw"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    {user?.cover && (
                      <div className="absolute inset-0 flex justify-center items-center bg-black/20 opacity-0 group-hover/covermain:opacity-100 transition-opacity">
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
                        {isUploadingCover ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Uploading…</> : "Upload Cover"}
                      </Button>
                      <Button size="icon" variant="secondary" className="size-9" disabled={isRemovingCover || !user?.cover} onClick={handleRemoveCover}>
                        {isRemovingCover ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-10 mt-0 focus-visible:ring-0">
              {/* ACTIVE SESSIONS */}
              <div>
                <div className="flex items-center gap-6 pb-4">
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">ACTIVE SESSIONS</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Connected Devices ({sessions.length})</p>
                    {sessions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTerminateAll}
                        disabled={isTerminatingAll}
                        className="hover:bg-destructive/10 px-2 h-7 font-bold text-[10px] text-destructive hover:text-destructive uppercase tracking-wider"
                      >
                        {isTerminatingAll ? <Loader2 className="mr-1.5 size-3 animate-spin" /> : <LogOut className="mr-1.5 size-3" />}
                        Logout all other devices
                      </Button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="bg-muted/20 py-12 border border-dashed rounded-xl text-center">
                      <div className="inline-flex justify-center items-center bg-muted mb-3 rounded-full size-12">
                        <Monitor className="size-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground text-sm">No active sessions found for this user.</p>
                    </div>
                  ) : (
                    <div className="gap-3 grid">
                      {sessions.map((s) => (
                        <div key={s.sessionId} className="group flex items-center gap-4 bg-card/50 hover:bg-card p-4 border rounded-xl transition-colors">
                          <div className="flex justify-center items-center bg-muted group-hover:bg-background rounded-full size-10 transition-colors shrink-0">
                            {s.deviceName.toLowerCase().includes("mobile") || s.deviceName.toLowerCase().includes("phone") || s.deviceName.toLowerCase().includes("android") || s.deviceName.toLowerCase().includes("iphone") ? (
                              <Smartphone className="size-5 text-muted-foreground" />
                            ) : (
                              <Monitor className="size-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{s.deviceName}</p>
                              {s.isCurrent && (
                                <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full font-bold text-[10px] text-green-700 dark:text-green-400">Current</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                              <span className="flex items-center text-[11px] text-muted-foreground">
                                <MapPin className="opacity-70 mr-1 size-3" /> {s.location}
                              </span>
                              <span className="flex items-center text-[11px] text-muted-foreground">
                                <Clock className="opacity-70 mr-1 size-3" /> {new Date(s.lastActiveAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive/10 size-8 text-muted-foreground hover:text-destructive"
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
                <div className="flex items-center gap-6 pb-4">
                  <span className="flex-1 border-b"></span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    <Label className="font-bold text-muted-foreground text-xs uppercase tracking-widest">SECURITY SETTINGS</Label>
                  </div>
                  <span className="flex-1 border-b"></span>
                </div>

                <div className="space-y-4 bg-card/50 p-6 border rounded-xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-4 text-muted-foreground" />
                      <Label htmlFor="newPassword">Reset User Password</Label>
                    </div>
                    <div className="flex sm:flex-row flex-col gap-3">
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
                        {isUpdatingPassword ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
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

        <CardFooter className="flex sm:flex-row flex-col justify-between items-stretch sm:items-center gap-4 bg-muted/10 p-6 border-t">
          <div className="flex sm:flex-row flex-col gap-2">
            <Button
              variant="destructive"
              disabled={isSelf}
              onClick={() => { setConfirmDialog({ isOpen: true, action: "delete" }); setConfirmInput(""); }}
              className="shadow-sm w-full sm:w-auto"
            >
              <Trash className="mr-2 w-4 h-4" /> Delete Account
            </Button>
            {!formData.isBanned ? (
              <Button
                variant="outline"
                disabled={isSelf}
                className="hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 w-full sm:w-auto text-orange-700"
                onClick={() => { setConfirmDialog({ isOpen: true, action: "ban" }); setConfirmInput(""); }}
              >
                <Ban className="mr-2 w-4 h-4" /> Ban User
              </Button>
            ) : (
              <Button
                variant="outline"
                className="hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 w-full sm:w-auto text-green-700"
                onClick={() => { setConfirmDialog({ isOpen: true, action: "unban" }); setConfirmInput(""); }}
              >
                Unban User
              </Button>
            )}
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="shadow-md w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
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
              <p className="mb-2 text-sm">Please type <strong>{confirmDialog.action}</strong> to confirm.</p>
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
