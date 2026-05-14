"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useNoteStore } from "@/app/stores/useNoteStore";
import ImageLightbox from "@/components/ImageLightbox";
import UserPageStatic from "./UserPageStatic";
import ProfileCard from "./ProfileCard";
import AdminDashboardCard from "./AdminDashboardCard";
import { Card } from "@/components/ui/card";
import { ICollection, IUser } from "@/types/model";
import CollectionsSection from "./CollectionSection";
import GitHubContribution from "@/components/GitHubContribution";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { axiosInstance } from "@/lib/axios";

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
  const { getAllCollections, collections: ownerCollections } = useNoteStore();

  const [user, setUser] = useState<IUser>(initialUser);
  const [collections, setCollections] = useState<ICollection[]>(initialCollections);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasFetchedCollectionsRef = useRef(false);
  const searchParams = useSearchParams();

  // GitHub contributions state — seed with SSR data if available
  const [contributions, setContributions] = useState<any | null>(githubData ?? null);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);
  const contributionsFetchedForRef = useRef<string | null>(null);

  // Handle ?github=success / ?github=error redirects from OAuth callback
  useEffect(() => {
    const githubStatus = searchParams.get("github");
    if (githubStatus === "success") {
      const { checkAuth } = useAuthStore.getState();
      checkAuth();
      toast.success("GitHub connected successfully!");
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

  // Fetch collections once auth is resolved
  useEffect(() => {
    if (isCheckingAuth) return;
    if (hasFetchedCollectionsRef.current) return;
    hasFetchedCollectionsRef.current = true;

    const fetchCollections = async () => {
      setIsLoadingCollections(true);
      try {
        if (isOwner) {
          setUser(authUser!);
          setCollections(ownerCollections || []);
        } else {
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
  }, [isCheckingAuth, isOwner]);

  // Sync owner data whenever authUser or store collections update
  useEffect(() => {
    if (isOwner && authUser) {
      setUser(authUser);
      setCollections(ownerCollections || []);
    }
  }, [isOwner, authUser, ownerCollections]);

  // Client-side GitHub contributions fetch
  // Runs whenever user.github.username is known and we don't have data yet
  useEffect(() => {
    const githubUsername = user?.github?.username;
    const profileUsername = user?.userName;

    // Nothing to do if user has no GitHub connected
    if (!githubUsername || !profileUsername) return;

    // Avoid duplicate fetches for the same user
    if (contributionsFetchedForRef.current === githubUsername) return;

    // If SSR already provided data, mark as fetched and skip
    if (contributions) {
      contributionsFetchedForRef.current = githubUsername;
      return;
    }

    contributionsFetchedForRef.current = githubUsername;

    const fetchContributions = async () => {
      setIsLoadingContributions(true);
      try {
        const res = await axiosInstance.get(`/auth/github/contributions/${profileUsername}`);
        setContributions(res.data);
      } catch (err: any) {
        console.error("Failed to fetch GitHub contributions:", err?.response?.data || err?.message);
        // Don't show error toast — just silently fail; the UI has a fallback message
      } finally {
        setIsLoadingContributions(false);
      }
    };

    fetchContributions();
  }, [user?.github?.username, user?.userName]);

  const profileShareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/${typeof username === "string" ? username : user.userName}`
      : "";

  if (!mounted) {
    return <UserPageStatic user={initialUser} collections={initialCollections} />;
  }

  const isGithubConnected = !!user?.github?.username;

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
        {/* Case 1: GitHub is connected — show heatmap, spinner, or error */}
        {isGithubConnected && (
          <Card className="p-6 mt-8 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            {isLoadingContributions ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading contributions…</span>
              </div>
            ) : contributions?.weeks ? (
              <GitHubContribution
                weeks={contributions.weeks}
                totalContributions={contributions.totalContributions ?? 0}
              />
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                Could not load contribution data. Try refreshing.
              </p>
            )}
          </Card>
        )}

        {/* Case 2: GitHub not connected AND this is the owner → show connect prompt */}
        {!isGithubConnected && isOwner && (
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