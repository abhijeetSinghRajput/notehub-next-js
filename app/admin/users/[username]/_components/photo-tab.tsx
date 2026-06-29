"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";
import ImageCropperModal from "@/components/ImageCropperModal";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { IUser } from "@/types/model";
import imageCompression from "browser-image-compression";

const PhotoTab = ({
  username,
  onPhotoClick,
}: {
  username: string;
  onPhotoClick: (src: string) => void;
}) => {
  const {
    singleUserCache,
    uploadUserAvatar,
    removeUserAvatar,
    uploadUserCover,
    removeUserCover,
  } = useAdminStore();

  const cachedUser = singleUserCache[username as string]?.data;
  const [user, setUser] = useState<IUser | null>(cachedUser || null);

  // Photo state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRemovingCover, setIsRemovingCover] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperMode, setCropperMode] = useState<"avatar" | "cover" | null>(
    null,
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const COVER_ASPECT = 767 / 192;

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

  const handlePhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "avatar" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, mode);
    e.target.value = "";
  };

  const handleCropConfirmed = useCallback(
    async (blob: Blob) => {
      const userId = user?._id as string;
      const mode = cropperMode;
      closeCropper();
      if (!userId || !mode) return;

      try {
        let file = new File(
          [blob],
          mode === "avatar" ? "avatar.jpg" : "cover.jpg",
          { type: "image/jpeg" },
        );
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
    },
    [cropperMode, closeCropper, user?._id, uploadUserAvatar, uploadUserCover],
  );

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

  return (
    <>
      {cropperSrc && cropperMode && (
        <ImageCropperModal
          src={cropperSrc}
          aspect={cropperMode === "avatar" ? 1 : COVER_ASPECT}
          circular={cropperMode === "avatar"}
          label={
            cropperMode === "avatar" ? "Crop Profile Photo" : "Crop Cover Photo"
          }
          onConfirm={handleCropConfirmed}
          onClose={closeCropper}
        />
      )}

      {/* AVATAR */}
      <div className="stripe-divider" />
      <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
        Profile Photo
      </h2>
      <div className="space-y-4 px-4 py-6">
        <div className="flex sm:flex-row flex-col items-start sm:items-center gap-8">
          <div className="relative size-36 shrink-0">
            <button
              onClick={() => user?.avatar && onPhotoClick(user.avatar)}
              className="group/avatarmain block relative bg-muted shadow-md border-4 border-card rounded-full size-36 overflow-hidden cursor-zoom-in"
              aria-label="View profile photo"
            >
              <Image
                src={user?.avatar || "/avatar.svg"}
                alt={user?.fullName || "Avatar"}
                fill
                sizes="144px"
                className="object-cover group-hover/avatarmain:scale-105 transition-transform"
              />
              {user?.avatar && (
                <div className="absolute inset-0 flex justify-center items-center bg-black/30 opacity-0 group-hover/avatarmain:opacity-100 transition-opacity">
                  <Plus className="size-8 text-white/80" />
                </div>
              )}
            </button>
          </div>
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Square profile photo · at least 400 × 400 px
              </p>
              <p className="text-muted-foreground text-sm">
                The image will be cropped to a square. Used on profile pages and
                comments.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingAvatar}
                onChange={(e) => handlePhotoFileChange(e, "avatar")}
              />
              <Button
                variant="default"
                size="sm"
                className="w-32"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Upload Photo"
                )}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="size-9"
                disabled={isRemovingAvatar || !user?.avatar}
                onClick={handleRemoveAvatar}
              >
                {isRemovingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* COVER */}
      <div className="stripe-divider" />
      <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
        Cover Photo
      </h2>
      <div>
        <button
          onClick={() => user?.cover && onPhotoClick(user.cover)}
          className="group/covermain relative bg-muted/30 w-full aspect-4/1 overflow-hidden cursor-zoom-in"
          aria-label="View cover photo"
        >
          <Image
            src={user?.cover || "/placeholder.svg"}
            alt="Cover"
            fill
            className={cn(
              "object-cover group-hover/covermain:scale-105 transition-transform duration-500",
              !user?.cover && "opacity-20",
            )}
            sizes="100vw"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          {user?.cover && (
            <div className="absolute inset-0 flex justify-center items-center bg-black/20 opacity-0 group-hover/covermain:opacity-100 transition-opacity">
              <Plus className="size-10 text-white/70" />
            </div>
          )}
        </button>

        <div className="space-y-4 screen-line-bottom px-4 py-6">
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              Cover banner · 767 × 192 px (auto-cropped)
            </p>
            <p className="text-muted-foreground text-sm">
              Shown as the background banner on this user&apos;s profile page.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingCover}
              onChange={(e) => handlePhotoFileChange(e, "cover")}
            />
            <Button
              variant="default"
              size="sm"
              className="w-32"
              disabled={isUploadingCover}
              onClick={() => coverInputRef.current?.click()}
            >
              {isUploadingCover ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Upload Cover"
              )}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="size-9"
              disabled={isRemovingCover || !user?.cover}
              onClick={handleRemoveCover}
            >
              {isRemovingCover ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PhotoTab;
