"use client";
import { useEffect, useState, useRef } from "react";
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
  const { authUser, isCheckingAuth } = useAuthStore();
  const { getAllCollections, collections: ownerCollections, status } = useNoteStore();

  const [user, setUser] = useState<IUser>(initialUser);
  const [collections, setCollections] = useState<ICollection[]>(initialCollections);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Wait for auth to resolve before determining ownership
  const isOwner = !isCheckingAuth && authUser?.userName === username;
  const isAdmin = authUser?.role === "admin";

  useEffect(() => {
    // Wait until auth check is done
    if (isCheckingAuth) return;
    // Only fetch once
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchCollections = async () => {
      setIsLoadingCollections(true);
      try {
        if (isOwner) {
          // Owner — use store data, no extra fetch needed
          setUser(authUser!);
          setCollections(ownerCollections || []);
        } else {
          // Guest — user data already from SSR (initialUser), only fetch collections
          const collectionsData = await getAllCollections({
            userId: initialUser._id,
            guest: true,
          });
          setCollections(collectionsData || []);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
        setCollections([]);
      } finally {
        setIsLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [isCheckingAuth, isOwner]);   // only re-run when auth resolves

  // Sync owner data if it updates in store
  useEffect(() => {
    if (isOwner && authUser) {
      setUser(authUser);
      setCollections(ownerCollections || []);
    }
  }, [isOwner, authUser, ownerCollections]);

  const profileShareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/${typeof username === "string" ? username : user.userName}`
      : "";

  if (!mounted) {
    return <UserPageStatic user={initialUser} collections={initialCollections} />;
  }

  return (
    <div className="p-4">
      {selectedImage && (
        <ImageLightbox src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      <ProfileCard
        user={user}
        isOwner={isOwner}
        isAdmin={isAdmin && !isOwner}
        profileShareLink={profileShareLink}
        onImageClick={setSelectedImage}
      />

      {isOwner && isAdmin && <AdminDashboardCard />}

      <div className="max-w-3xl mx-auto mt-8">
        <CollectionsSection
          collections={collections}
          isOwner={isOwner}
          isAdmin={isAdmin}
          isLoading={isLoadingCollections}
        />
      </div>
    </div>
  );
};

export default UserPageClient;