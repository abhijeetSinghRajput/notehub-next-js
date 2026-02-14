"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ImageOff, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/app/stores/useAuthStore";
import imageCompression from "browser-image-compression";
import { useNoteStore } from "@/app/stores/useNoteStore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import {
  CollectionSkeleton,
  ProfilePageSkeleton,
} from "@/components/sekeletons/ProfilePageSkeleton";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CollectionCard from "@/components/CollectionCard";
import TooltipWrapper from "@/components/TooltipWrapper";
import SortSelector from "@/components/SortSelector";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { ICollection, IUser } from "@/types/model";

const UserPageClient = ({ initialUser }: { initialUser: IUser }) => {
  const { username } = useParams();
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
  const {
    getAllCollections,
    collections: ownerCollections,
    status,
  } = useNoteStore();
  const [user, setUser] = useState<IUser | null>(initialUser);
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { pinnedCollections } = useLocalStorage();
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<
    "avatar" | "cover" | null
  >(null);
  const [previewavatar, setPreviewavatar] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const isOwner = authUser?.userName === username;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (isOwner) {
          // Use store data for owner
          setUser(authUser);
          setCollections(ownerCollections || []);
        } else {
          // Fetch data for other users
          const response = await axiosInstance.get(`/user/${username}`);
          setUser(response.data);

          const collectionsData = await getAllCollections({
            userId: response.data?._id,
            guest: true,
          });
          setCollections(collectionsData || []);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setUser(null);
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, authUser, ownerCollections, isOwner, getAllCollections]);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    onUpload: (file: File) => Promise<any>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
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
      setPreview(null);
    } catch (error) {
      console.error("Error compressing or uploading:\n", error);
    } finally {
      e.target.value = ""; // Reset file input
    }
  };

  const handleRemoveImage = async (
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    onRemove: () => Promise<any>,
  ) => {
    const result = await onRemove();
    if (result) {
      setPreview(null);
    }
  };

  const pinnedSet = React.useMemo(
    () => new Set(pinnedCollections),
    [pinnedCollections],
  );

  const sortedCollections = React.useMemo(() => {
    if (!collections?.length) return [];

    const dir = sortDirection === "asc" ? 1 : -1;

    return [...collections].sort((a, b) => {
      // 1️⃣ Pinned first
      const ap = pinnedSet.has(a._id);
      const bp = pinnedSet.has(b._id);
      if (ap !== bp) return ap ? -1 : 1;

      // 2️⃣ Sorting
      switch (sortBy) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "created":
          return (
            dir *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        case "updated":
          return (
            dir *
            (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
          );
        default:
          return 0;
      }
    });
  }, [collections, pinnedSet, sortBy, sortDirection]);

  if (isLoading) return <ProfilePageSkeleton />;

  if (!user) {
    return (
      <div className="p-4 overflow-auto flex items-center justify-center h-full">
        <Card className="max-w-3xl w-full mx-auto p-8 text-center">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="text-muted-foreground mt-2">
            The user @{username} doesn't exist or you don't have permission to
            view this profile.
          </p>
        </Card>
      </div>
    );
  }

  const disableImageRemove =
    currentImageType === "avatar"
      ? isRemovingAvatar || !user?.avatar // disable for avatar
      : isRemovingCover || !user?.cover; // disable for cover

  const disableImageUpload =
    currentImageType === "avatar" ? isUploadingAvatar : isUploadingCover;

  const noPhoto =
    currentImageType === "avatar"
      ? !Boolean(user?.avatar) && !previewCover
      : !Boolean(user?.cover) && !previewavatar;

  return (
    <div className="p-4">
      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-[100vw] sm:max-w-none w-auto">
          <DialogHeader className="p-0 hidden">
            <DialogTitle>
              {currentImageType === "avatar" ? "Profile Photo" : "Cover Photo"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col p-0">
            {noPhoto ? (
              <div className="relative w-75 h-75 p-4">
                <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground h-full">
                  <div className="p-8 rounded-full bg-input/30">
                    <ImageOff className="size-16 stroke-1" />
                  </div>
                  <p className="text-center text-sm">No {currentImageType}</p>
                </div>
              </div>
            ) : (
              <div className="bg-primary/5 flex justify-center items-center">
                <img
                  src={
                    (currentImageType === "avatar"
                      ? user?.avatar
                      : user?.cover) || "/avatar.svg"
                  }
                  alt={`user ${currentImageType}`}
                  className="max-w-[100vw] max-h-[80vh] min-h-75 object-contain"
                  style={{
                    width:
                      currentImageType === "avatar"
                        ? "min(400px, 100vw)"
                        : "min(800px, 100vw)",
                    height: "auto",
                  }}
                />
              </div>
            )}

            {isOwner && (
              <DialogFooter className="p-4 border-t sticky bottom-0 bg-background">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <label
                    htmlFor={currentImageType ?? undefined}
                    className="contents"
                  >
                    <input
                      type="file"
                      id={currentImageType ?? undefined}
                      accept="image/*"
                      className="hidden"
                      disabled={disableImageUpload}
                      onChange={(e) =>
                        handleUploadImage(
                          e,
                          currentImageType === "avatar"
                            ? setPreviewavatar
                            : setPreviewCover,
                          currentImageType === "avatar"
                            ? uploadUserAvatar
                            : uploadUserCover,
                        )
                      }
                    />
                    <Button
                      asChild
                      className={cn(
                        "button cursor-pointer w-full",
                        disableImageUpload && "disabled",
                      )}
                    >
                      <span>
                        {disableImageUpload ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading
                          </>
                        ) : (
                          "Upload"
                        )}
                      </span>
                    </Button>
                  </label>

                  <Button
                    onClick={() =>
                      handleRemoveImage(
                        currentImageType === "avatar"
                          ? setPreviewavatar
                          : setPreviewCover,
                        currentImageType === "avatar"
                          ? removeUserAvatar
                          : removeUserCover,
                      )
                    }
                    disabled={disableImageRemove}
                    variant="secondary"
                    className="w-full"
                  >
                    {isRemovingAvatar || isRemovingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Card */}
      <Card
        className={cn(
          "max-w-3xl mx-auto overflow-hidden shadow-sm",
          isLoading && "animate-pulse",
        )}
      >
        <Avatar
          className="relative rounded-none max-h-48 h-full w-full overflow-hidden cursor-pointer"
          style={{ aspectRatio: "3/1" }}
          onClick={() => {
            setCurrentImageType("cover");
            setIsImageDialogOpen(true);
          }}
        >
          <AvatarImage
            src={user?.cover}
            alt="User cover Photo"
            loading="eager" // ⚠️ important for LCP
            fetchPriority="high" // ⚠️ important for LCP
            decoding="async"
            className="w-full h-full max-h-48 object-cover"
            style={{ aspectRatio: "3 / 1" }}
          />
          <AvatarFallback className="rounded-none brightness-[0.2]">
            <img
              src="/placeholder.svg"
              alt="placeholder"
              className="w-full h-full object-cover"
              style={{ aspectRatio: "3/1" }}
            />
          </AvatarFallback>
        </Avatar>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:gap-8 gap-2 sm:items-center">
            <Avatar
              className="relative shadow-md w-28 h-28 sm:w-48 sm:h-48 shrink-0 border-4 sm:border-8 border-background -mt-14 rounded-full cursor-pointer"
              onClick={() => {
                setCurrentImageType("avatar");
                setIsImageDialogOpen(true);
              }}
              role="button"
              aria-label="View profile photo"
            >
              <AvatarImage
                src={user?.avatar || "/avatar.svg"}
                alt="User avatar"
                loading="lazy"
                fetchPriority="low"
                className="w-full h-full object-cover"
              />
              <AvatarFallback
                className="text-4xl flex items-center justify-center bg-muted dark:brightness-[0.2]"
                aria-hidden="true"
              >
                <img
                  src="/avatar.svg"
                  alt="fallback avatar"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </AvatarFallback>
            </Avatar>

            <div className="flex m-0 justify-between w-full items-start">
              <div>
                <h1 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                  {user?.fullName}
                  {user?.role === "admin" && (
                    <BadgeIcon className="size-4 sm:size-5 text-blue-500" />
                  )}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  @{user?.userName}
                </p>
              </div>
              {isOwner && (
                <TooltipWrapper message="Edit Profile">
                  <Link
                    href="/settings/profile"
                    aria-label="Edit profile"
                    className="hover:bg-muted rounded-md size-10 flex justify-center items-center"
                  >
                    <Pencil size={18} />
                  </Link>
                </TooltipWrapper>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections Section */}
      <div className="max-w-3xl mx-auto mt-8">
        {status.collection.state === "loading" ? (
          <CollectionSkeleton />
        ) : collections.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-muted-foreground">No collections found</p>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Collections</h2>
                <div className="text-sm text-muted-foreground">
                  {collections.length}{" "}
                  {collections.length === 1 ? "collection" : "collections"}
                </div>
              </div>
              <SortSelector
                sortBy={sortBy}
                sortDirection={sortDirection}
                setSortBy={setSortBy}
                toggleSortDirection={toggleSortDirection}
              />
            </div>
            <div className="space-y-0">
              {sortedCollections.map((collection) => (
                <CollectionCard
                  key={collection._id}
                  collection={collection}
                  isOwner={isOwner}
                  pinnedCollections={pinnedCollections}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserPageClient;
