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
import GitHubContribution from "@/components/GitHubContribution";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";



const UserPageClient = ({
  initialUser,
  initialCollections = [],
  githubData,
}: {
  initialUser: IUser;
  initialCollections?: any[];
  githubData?: any;
}) => {
  const { username } = useParams();
  const { authUser, isCheckingAuth } = useAuthStore();
  const { getAllCollections, collections: ownerCollections, status } = useNoteStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";


  const [user, setUser] = useState<IUser>(initialUser);
  const [collections, setCollections] = useState<ICollection[]>(initialCollections);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasFetchedRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const githubStatus = searchParams.get("github");
    if (githubStatus === "success") {
      toast.success("GitHub connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (githubStatus === "error") {
      toast.error("Failed to connect GitHub.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);


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

      <div className="max-w-3xl mx-auto">
        {user.github?.username && githubData ? (
          <Card className="p-6 mt-8 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <GitHubContribution
              weeks={githubData.weeks}
              totalContributions={githubData.totalContributions}
              isDark={isDark}
            />
          </Card>
        ) : (

          isOwner && (
            <Card className="p-6 mt-8 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 group">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-500/10 transition-colors">
                    <Github className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Showcase your GitHub activity
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Connect your GitHub account to display your contribution graph on your profile.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const { connectGithub } = useAuthStore.getState();
                    connectGithub();
                  }}
                >
                  Connect GitHub
                </Button>
              </div>
            </Card>
          )
        )}
      </div>

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