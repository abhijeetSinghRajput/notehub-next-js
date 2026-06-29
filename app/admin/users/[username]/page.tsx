"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { Session } from "@/types/model";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Ban,
  Trash,
  User2Icon,
  ShieldCheck,
  Loader2,
  Camera,
} from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import type { IUser } from "@/types/model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateUsername } from "@/lib/validator";
import ProfileTab from "./_components/profile-tab";
import PhotoTab from "./_components/photo-tab";
import SecurityTab from "./_components/security-tab";
import ConfirmDialog from "./_components/confirm-dialog";
import ProfileCard from "./_components/profile-card";
import EditProfileSkeleton from "./_components/edit-profile-skeleton";
type FormData = {
  fullName: string;
  userName: string;
  bio: string;
  socials: { url: string }[];
  role: "user" | "admin";
  isBanned: boolean;
  skills: string[];
};

function buildFormData(data: IUser): FormData {
  return {
    fullName: data.fullName || "",
    userName: data.userName || "",
    bio: data.bio || "",
    socials: data.socials
      ? data.socials.map((s: { url: string }) => ({ url: s.url }))
      : [],
    role: data.role || "user",
    isBanned: data.isBanned || false,
    skills: data.skills || [],
  };
}

function getIsDirty(formData: FormData, original: FormData): boolean {
  return (
    formData.fullName !== original.fullName ||
    formData.userName !== original.userName ||
    formData.bio !== original.bio ||
    formData.role !== original.role ||
    formData.isBanned !== original.isBanned ||
    JSON.stringify(formData.skills) !== JSON.stringify(original.skills) ||
    JSON.stringify(
      formData.socials.map((s) => s.url.trim()).filter(Boolean),
    ) !==
      JSON.stringify(original.socials.map((s) => s.url.trim()).filter(Boolean))
  );
}

export default function AdminUserEditPage() {
  const { username } = useParams();
  const router = useRouter();
  const {
    updateUser,
    batchUpdateUsers,
    fetchUserByUsername,
    fetchUserSessions,
    isLoadingUsers,
    singleUserCache,
  } = useAdminStore();

  const { authUser } = useAuthStore();

  const cachedUser = singleUserCache[username as string]?.data;
  const [user, setUser] = useState<IUser | null>(cachedUser || null);
  const isSelf = authUser?._id === user?._id;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState<FormData>(
    cachedUser
      ? buildFormData(cachedUser)
      : {
          fullName: "",
          userName: "",
          bio: "",
          socials: [],
          role: "user",
          isBanned: false,
          skills: [],
        },
  );

  // Track the last-saved snapshot to compute isDirty
  const [savedData, setSavedData] = useState<FormData>(formData);
  const isDirty = getIsDirty(formData, savedData);

  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<
    string | null
  >(null);
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
        const built = buildFormData(data);
        setFormData(built);
        setSavedData(built);
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
      socials: formData.socials
        .map((s) => ({ url: s.url.trim() }))
        .filter((s) => s.url),
    };

    const result = await updateUser(userId, payload);
    if (result.success) {
      toast.success("User updated successfully");
      if (result.user) {
        setUser(result.user);
        const built = buildFormData(result.user);
        setSavedData(built);
      }
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
        setFormData((prev) => ({ ...prev, isBanned: action === "ban" }));
        setSavedData((prev) => ({ ...prev, isBanned: action === "ban" }));
        setConfirmDialog({ isOpen: false, action: "delete" });
      }
    } else {
      toast.error(result.message || "Action failed");
    }

    setIsSaving(false);
  };

  if (isLoadingUsers && !user) {
    return <EditProfileSkeleton />;
  }

  if (!user && !isLoadingUsers) return null;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="border-x pb-8">
        <ProfileCard
          user={user}
          onPhotoClick={setSelectedLightboxImage}
          isSelf={isSelf}
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            variant="line"
            className="flex-nowrap justify-start -mb-px w-full h-12 overflow-x-auto overflow-y-hidden scrollbar-hide border-b"
            style={{ willChange: "scroll-position" }}
          >
            <TabsTrigger
              value="profile"
              className="h-auto data-[state=active]:bg-transparent px-6 py-3"
            >
              <User2Icon className="mr-2 size-4" />
              Profile Info
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="h-auto data-[state=active]:bg-transparent px-6 py-3"
            >
              <Camera className="mr-2 size-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="h-auto data-[state=active]:bg-transparent px-6 py-3"
            >
              <ShieldCheck className="mr-2 size-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0 focus-visible:ring-0">
            <ProfileTab
              formData={formData}
              setFormData={setFormData}
              usernameError={usernameError}
              setUsernameError={setUsernameError}
              isSelf={isSelf}
            />

            {/* ── STICKY FOOTER — profile tab only ── */}
            <div className="sticky bg-background bottom-0 border-t">
              <div className="flex justify-between items-stretch sm:items-center gap-4 py-3 px-4">
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={isSelf}
                    onClick={() => {
                      setConfirmDialog({ isOpen: true, action: "delete" });
                      setConfirmInput("");
                    }}
                    className="shadow-sm w-9 sm:w-auto"
                  >
                    <Trash />
                    <span className="hidden sm:inline-block">
                      Delete Account
                    </span>
                  </Button>
                  {!formData.isBanned ? (
                    <Button
                      variant="outline"
                      disabled={isSelf}
                      className="hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 w-9 sm:w-auto text-orange-700"
                      onClick={() => {
                        setConfirmDialog({ isOpen: true, action: "ban" });
                        setConfirmInput("");
                      }}
                    >
                      <Ban />
                      <span className="hidden sm:inline-block">Ban User</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 w-full sm:w-auto text-green-700"
                      onClick={() => {
                        setConfirmDialog({ isOpen: true, action: "unban" });
                        setConfirmInput("");
                      }}
                    >
                      Unban User
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-0 focus-visible:ring-0">
            <PhotoTab
              username={username as string}
              onPhotoClick={setSelectedLightboxImage}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab
              sessions={sessions}
              setSessions={setSessions}
              userId={user?._id}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        action={confirmDialog.action}
        isOpen={confirmDialog.isOpen}
        userName={user?.userName}
        loading={isSaving}
        onOpenChange={(isOpen) =>
          !isOpen && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={(e) => {
          e.preventDefault();
          handleDestructiveAction();
        }}
      />

      {selectedLightboxImage && (
        <ImageLightbox
          src={selectedLightboxImage}
          onClose={() => setSelectedLightboxImage(null)}
        />
      )}
    </div>
  );
}
