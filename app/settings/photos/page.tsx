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
import { Avatar } from "@/components/ui/avatar";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import ImageLightbox from "@/components/ImageLightbox";

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

  const [previewavatar, setPreviewavatar] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    onUpload: (file: File) => Promise<unknown>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Set image preview (optional)
      const previewURL = URL.createObjectURL(file);
      setPreview(previewURL);

      let finalFile = file;

      // 🗜️ Compress only if size > 1MB
      if (file.size > 1024 * 1024) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        finalFile = await imageCompression(file, options);
      }
      await onUpload(finalFile);
    } catch (error) {
      console.error("Error compressing or uploading:\n", error);
    } finally {
      e.target.value = ""; // Reset file input
    }
  };

  const handleRemoveImage = async (
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    onRemove: () => Promise<unknown>,
  ) => {
    const result = await onRemove();
    if (result) {
      setPreview(null);
    }
  };

  return (
    <>
      <h1 className="sr-only">Photos & Cover Settings</h1>
      <Card>
        {selectedImage && (
          <ImageLightbox
            src={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
        <CardHeader>
          <CardTitle>Photos & Cover</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your profile and cover photos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          {/* AVATAR SECTION  */}
          <div className="space-y-4">
            <Label>Your Photo</Label>
            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
              <div
                className="relative size-44 shrink-0 rounded-full overflow-hidden cursor-pointer"
                onClick={() =>
                  setSelectedImage(
                    previewavatar || authUser?.avatar || "/avatar.svg",
                  )
                }
                role="button"
                aria-label="Open profile photo"
              >
                <Image
                  src={previewavatar || authUser?.avatar || "/avatar.svg"}
                  alt="User Avatar"
                  fill
                  sizes="176px"
                  className="object-cover"
                  unoptimized={!!(previewavatar || authUser?.avatar)} // Cloudinary already optimized
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    File smaller than 10MB and at least 400px by 400px
                  </p>
                  <p className="text-muted-foreground text-sm">
                    This image will be shwon in your profile page if you choose
                    to share it with other memeber it will also help us
                    recognize you
                  </p>
                </div>

                <div className="flex gap-2">
                  <label htmlFor="profile-photo">
                    <input
                      type="file"
                      id="profile-photo"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={(e) =>
                        handleUploadImage(e, setPreviewavatar, uploadUserAvatar)
                      }
                    />

                    <Button
                      asChild
                      variant="default"
                      size="default"
                      className="w-32"
                      disabled={isUploadingAvatar}
                    >
                      <span>
                        {isUploadingAvatar ? (
                          <span className="flex items-center gap-1">
                            Uploading...
                            <Loader2 className="animate-spin size-4" />
                          </span>
                        ) : (
                          "Upload Photo"
                        )}
                      </span>
                    </Button>
                  </label>

                  <Button
                    onClick={() =>
                      handleRemoveImage(setPreviewavatar, removeUserAvatar)
                    }
                    size="icon"
                    disabled={isRemovingAvatar || !authUser?.avatar}
                    variant="secondary"
                    className="relative overflow-hidden"
                  >
                    {isRemovingAvatar ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* COVER SECTION  */}
          <div className="space-y-4">
            <Label>Profile Page Cover</Label>
            <div className="flex flex-col sm:flex-col gap-8 items-start">
              <div
                className="relative w-full h-48 rounded-xl overflow-hidden cursor-pointer"
                onClick={() =>
                  setSelectedImage(
                    previewCover || authUser?.cover || "/profile-cover.svg",
                  )
                }
                role="button"
                aria-label="Open cover photo"
              >
                <Image
                  src={previewCover || authUser?.cover || "/profile-cover.svg"}
                  alt="background-cover-image"
                  fill
                  className="object-cover bg-background"
                  sizes="100vw"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = "/profile-cover.svg";
                  }}
                  priority
                />
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    File smaller than 10MB and at least 1200px by 300px
                  </p>
                  <p className="text-muted-foreground text-sm">
                    This image will be shown as background banner in your
                    profile page if you choose to share it with other members.
                  </p>
                </div>

                <div className="flex gap-2">
                  <label htmlFor="profile-cover">
                    <input
                      type="file"
                      id="profile-cover"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingCover}
                      onChange={(e) =>
                        handleUploadImage(e, setPreviewCover, uploadUserCover)
                      }
                    />
                    <Button
                      asChild
                      variant="default"
                      size="default"
                      className="w-32 cursor-pointer"
                      disabled={isUploadingCover}
                    >
                      <span>
                        {isUploadingCover ? (
                          <span className="flex items-center gap-1">
                            Uploading...{" "}
                            <Loader2 className="animate-spin size-4" />
                          </span>
                        ) : (
                          "Upload Photo"
                        )}
                      </span>
                    </Button>
                  </label>

                  <Button
                    onClick={() =>
                      handleRemoveImage(setPreviewCover, removeUserCover)
                    }
                    size="icon"
                    disabled={isRemovingCover || !authUser?.cover}
                    variant="secondary"
                    className="relative overflow-hidden"
                  >
                    {isRemovingCover ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
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
