"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { Loader2, Trash2, User, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import ImageLightbox from "@/components/ImageLightbox";
import ImageCropperModal from "@/components/ImageCropperModal";

const COVER_ASPECT = 767 / 192;

const Photos = () => {
  const {
    authUser,
    uploadUserAvatar,
    removeUserAvatar,
    isUploadingAvatar,
    isRemovingAvatar,
    isUploadingCover,
    isRemovingCover,
    uploadUserCover,
    removeUserCover,
  } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperMode, setCropperMode] = useState<"avatar" | "cover" | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const openCropper = (file: File, mode: "avatar" | "cover") => {
    const url = URL.createObjectURL(file);
    setCropperSrc(url);
    setCropperMode(mode);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, mode);
    e.target.value = "";
  };

  const closeCropper = useCallback(() => {
    if (cropperSrc) URL.revokeObjectURL(cropperSrc);
    setCropperSrc(null);
    setCropperMode(null);
  }, [cropperSrc]);

  const handleCropConfirmed = useCallback(async (blob: Blob) => {
    const mode = cropperMode;
    closeCropper();
    try {
      let file = new File([blob], mode === "avatar" ? "avatar.jpg" : "cover.jpg", {
        type: "image/jpeg",
      });
      if (file.size > 800 * 1024) {
        file = (await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: mode === "cover" ? 1534 : 1024,
          useWebWorker: true,
        })) as File;
      }
      if (mode === "avatar") {
        await uploadUserAvatar(file);
      } else {
        await uploadUserCover(file);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  }, [cropperMode, closeCropper, uploadUserAvatar, uploadUserCover]);

  return (
    <>
      <h1 className="sr-only">Photos &amp; Cover Settings</h1>

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

      <Card>
        {selectedImage && (
          <ImageLightbox
            src={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
        <CardHeader>
          <CardTitle>Photos &amp; Cover</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your profile and cover photos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">

          {/* ── AVATAR SECTION ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 pb-4">
              <span className="border-b flex-1"></span>
              <div className="flex items-center gap-2">
                <User className="size-4" />
                <Label>PROFILE PHOTO</Label>
              </div>
              <span className="border-b flex-1"></span>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
              <button
                type="button"
                className="relative size-44 shrink-0 rounded-full overflow-hidden cursor-pointer ring-2 ring-border ring-offset-2 ring-offset-background hover:ring-primary transition-all focus-visible:outline-none focus-visible:ring-primary"
                onClick={() => setSelectedImage(authUser?.avatar || "/avatar.svg")}
                aria-label="View profile photo"
              >
                <Image
                  src={authUser?.avatar || "/avatar.svg"}
                  alt="User Avatar"
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </button>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    File smaller than 10 MB · at least 400 × 400 px
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Your photo will be cropped to a square before uploading.
                    It&apos;s shown on your profile and helps others recognise you.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingAvatar}
                    onChange={(e) => handleFileChange(e, "avatar")}
                  />
                  <Button
                    variant="default"
                    size="default"
                    className="w-36"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <span className="flex items-center gap-1.5">
                        Uploading… <Loader2 className="animate-spin size-4" />
                      </span>
                    ) : (
                      "Upload Photo"
                    )}
                  </Button>
                  <Button
                    onClick={() => removeUserAvatar()}
                    size="icon"
                    disabled={isRemovingAvatar || !authUser?.avatar}
                    variant="secondary"
                  >
                    {isRemovingAvatar ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── COVER SECTION ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 pb-4">
              <span className="border-b flex-1"></span>
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                <Label>PROFILE COVER</Label>
              </div>
              <span className="border-b flex-1"></span>
            </div>

            <div className="flex flex-col gap-6 items-start">
              <button
                type="button"
                className="relative w-full rounded-xl overflow-hidden cursor-pointer ring-2 ring-border ring-offset-2 ring-offset-background hover:ring-primary transition-all focus-visible:outline-none focus-visible:ring-primary"
                style={{ aspectRatio: `${767} / ${192}` }}
                onClick={() => setSelectedImage(authUser?.cover || "/placeholder.svg")}
                aria-label="View cover photo"
              >
                <Image
                  src={authUser?.cover || "/placeholder.svg"}
                  alt="Cover Photo"
                  fill
                  className="object-cover bg-background"
                  sizes="100vw"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                  }}
                  priority
                />
              </button>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    File smaller than 10 MB · recommended 767 × 192 px
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Your image will be cropped to 767 × 192 px before uploading.
                    It&apos;s shown as a banner on your profile page.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingCover}
                    onChange={(e) => handleFileChange(e, "cover")}
                  />
                  <Button
                    variant="default"
                    size="default"
                    className="w-36"
                    disabled={isUploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {isUploadingCover ? (
                      <span className="flex items-center gap-1.5">
                        Uploading… <Loader2 className="animate-spin size-4" />
                      </span>
                    ) : (
                      "Upload Photo"
                    )}
                  </Button>
                  <Button
                    onClick={() => removeUserCover()}
                    size="icon"
                    disabled={isRemovingCover || !authUser?.cover}
                    variant="secondary"
                  >
                    {isRemovingCover ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </>
  );
};

export default Photos;
