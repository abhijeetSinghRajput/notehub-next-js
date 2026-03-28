"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  ShieldCheck,
  ArrowRight,
  FolderPlus,
  Library,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useNoteStore } from "@/app/stores/useNoteStore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import {
  CollectionSkeleton,
  ProfilePageSkeleton,
} from "@/components/sekeletons/ProfilePageSkeleton";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import CollectionCard from "@/components/CollectionCard";
import TooltipWrapper from "@/components/TooltipWrapper";
import SortSelector from "@/components/SortSelector";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { ICollection, IUser } from "@/types/model";
import WritingTipsCard from "@/components/WritingTipsCard";
import AddNoteDialog from "@/components/AddNoteDialog";
import SharePopoverWrapper from "@/components/ShareNotePopover.client";
import ImageLightbox from "@/components/ImageLightbox";
import CloudinaryImage from "@/components/ui/cloudinary-image";

const UserPageClient = ({ initialUser }: { initialUser: IUser }) => {
  const { username } = useParams();
  const { authUser } = useAuthStore();
  const {
    getAllCollections,
    collections: ownerCollections,
    status,
  } = useNoteStore();
  const [user, setUser] = useState<IUser | null>(initialUser);
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { pinnedCollections } = useLocalStorage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [profileShareLink, setProfileShareLink] = useState("");

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const profilePath =
      typeof username === "string" ? username : user?.userName;
    if (!profilePath) return;

    setProfileShareLink(`${window.location.origin}/${profilePath}`);
  }, [username, user?.userName]);

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
            The user @{username} doesn&apos;t exist or you don&apos;t have permission to
            view this profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {selectedImage && (
        <ImageLightbox
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Profile Card */}
      <Card
        className={cn(
          "max-w-3xl mx-auto overflow-hidden shadow-sm",
          isLoading && "animate-pulse",
        )}
      >
        <div
          className="relative rounded-none max-h-48 h-full w-full overflow-hidden cursor-pointer"
          style={{ aspectRatio: "3/1" }}
          onClick={() => setSelectedImage(user?.cover || "/profile-cover.svg")}
        >
          <CloudinaryImage
            src={user?.cover || "/profile-cover.svg"}
            alt="User cover photo"
            fill
            sizes="100vw"
            className="object-cover"
            preload
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:gap-8 gap-2 sm:items-center">
            <div
              className="relative shadow-md w-28 h-28 sm:w-48 sm:h-48 shrink-0 border-4 sm:border-8 border-background -mt-14 rounded-full overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(user?.avatar || "/avatar.svg")}
              role="button"
              aria-label="View profile photo"
            >
              <CloudinaryImage
                src={user?.avatar || "/avatar.svg"}
                alt="User avatar"
                fill
                sizes="(max-width: 640px) 112px, 192px"
                className="object-cover"
                loading="lazy"
                fetchPriority="low"
              />
            </div>

            <div className="flex m-0 justify-between w-full items-start gap-2">
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
              <div className="flex items-center gap-2">
                {isOwner && (
                  <TooltipWrapper message="Edit Profile">
                    <Link
                      href="/settings/profile"
                      aria-label="Edit profile"
                      className="hover:bg-muted rounded-full size-10 flex justify-center items-center"
                    >
                      <Pencil size={18} />
                    </Link>
                  </TooltipWrapper>
                )}
                <SharePopoverWrapper
                  shareLink={profileShareLink}
                  triggerVariant="ghost"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Dashboard Card */}
      {isOwner && authUser?.role === "admin" && (
        <Card className="max-w-3xl mx-auto mt-4 overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <Link
              href="/admin/user-management"
              className="flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage users and site settings
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Collections Section */}
      <div className="max-w-3xl mx-auto mt-8">
        {status.collection.state === "loading" ? (
          <CollectionSkeleton />
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center gap-6">
            <Card className="py-16 w-full">
              <CardContent className="flex flex-col items-center text-center gap-4 p-6">
                <div className="rounded-full bg-muted p-4">
                  <Library className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    {isOwner
                      ? "Create your first collection"
                      : "No collections yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {isOwner
                      ? "Collections help you organize your notes by topic. Start by creating one!"
                      : "This user hasn't created any collections yet. Check back later!"}
                  </p>
                </div>
                {isOwner && (
                  <AddNoteDialog
                    trigger={
                      <Button className="mt-2 gap-2">
                        <FolderPlus className="h-4 w-4" />
                        New Collection
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
            {isOwner && <WritingTipsCard defaultOpen={true} />}
          </div>
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
            <div className="space-y-0 divide-y divide-border">
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
