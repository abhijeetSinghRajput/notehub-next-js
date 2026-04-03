"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { ProfilePageSkeleton } from "@/components/sekeletons/ProfilePageSkeleton";
import ImageLightbox from "@/components/ImageLightbox";
import UserPageStatic from "./UserPageStatic";
import ProfileCard from "./ProfileCard";
import AdminDashboardCard from "./AdminDashboardCard";
import { Card } from "@/components/ui/card";
import { ICollection, IUser } from "@/types/model";
import CollectionsSection from "./CollectionSection";

const UserPageClient = ({
  initialUser,
  initialCollections = [],
}: {
  initialUser: IUser;
  initialCollections?: any[];
}) => {
  const { username } = useParams();
  const { authUser } = useAuthStore();
  const { getAllCollections, collections: ownerCollections, status } = useNoteStore();

  const [user, setUser] = useState<IUser | null>(initialUser);
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileShareLink, setProfileShareLink] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isOwner = authUser?.userName === username;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (isOwner) {
          setUser(authUser);
          setCollections(ownerCollections || []);
        } else {
          const { axiosInstance } = await import("@/lib/axios");
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
    const profilePath = typeof username === "string" ? username : user?.userName;
    if (!profilePath) return;
    setProfileShareLink(`${window.location.origin}/${profilePath}`);
  }, [username, user?.userName]);

  if (!mounted) {
    return <UserPageStatic user={initialUser} collections={initialCollections} />;
  }

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
        <ImageLightbox src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      <ProfileCard
        user={user}
        isOwner={isOwner}
        profileShareLink={profileShareLink}
        onImageClick={setSelectedImage}
      />

      {isOwner && authUser?.role === "admin" && <AdminDashboardCard />}

      <div className="max-w-3xl mx-auto mt-8">
        <CollectionsSection
          collections={collections}
          isOwner={isOwner}
          isLoading={status.collection.state === "loading"}
        />
      </div>
    </div>
  );
};

export default UserPageClient;