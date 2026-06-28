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

const skeletonWeeks = Array.from({ length: 53 }, () => ({
  contributionDays: Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return { date: d.toISOString().split("T")[0], contributionCount: 0 };
  }),
}));

const UserPageClient = ({
  initialUser,
  initialCollections = [],
}: {
  initialUser: IUser;
  initialCollections?: any[];
}) => {
  const { username } = useParams();
  const { authUser, isCheckingAuth } = useAuthStore();
  const { getAllCollections, collections: ownerCollections } = useNoteStore();

  const [user, setUser] = useState<IUser>(initialUser);
  const [collections, setCollections] =
    useState<ICollection[]>(initialCollections);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasFetchedCollectionsRef = useRef(false);
  const searchParams = useSearchParams();

  // GitHub contributions state — seed with SSR data if available
  const [contributions, setContributions] = useState<any | null>(null);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);
  const contributionsFetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    const githubStatus = searchParams.get("github");
    const reason = searchParams.get("reason");

    const reasonMessages: Record<string, string> = {
      no_code: "GitHub did not return an authorization code.",
      state_mismatch: "Security check failed. Please try connecting again.",
      oauth_failed: "GitHub OAuth failed. Please try again.",
      user_fetch_failed: "Could not fetch your GitHub profile.",
      user_not_found: "Your account could not be found.",
      server_error: "A server error occurred. Please try again later.",
    };

    if (githubStatus === "success") {
      const { checkAuth } = useAuthStore.getState();
      checkAuth();
      toast.success("GitHub connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (githubStatus === "error") {
      const detail = reason
        ? (reasonMessages[reason] ?? `Error: ${reason}`)
        : "Failed to connect GitHub.";
      toast.error(detail);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!githubUsername || !profileUsername) return;

    setIsLoadingContributions(true);
    axiosInstance
      .get(`/auth/github/contributions/${profileUsername}`)
      .then((res) => setContributions(res.data))
      .catch((e) => {console.log(e)})
      .finally(() => setIsLoadingContributions(false));
  }, []); 

  // ── GitHub action handlers ──────────────────────────────────────────────────

  /** Disconnect GitHub and wipe local contribution state */
  const handleDisconnect = async () => {
    const { disconnectGithub } = useAuthStore.getState();
    const ok = await disconnectGithub();
    if (ok) {
      setContributions(null);
      contributionsFetchedForRef.current = null;
    }
  };

  /** Force-refetch contributions (resets the dedup guard) */
  const handleRefetchContributions = async () => {
    const githubUsername = user?.github?.username;
    const profileUsername = user?.userName;
    if (!githubUsername || !profileUsername) return;
    contributionsFetchedForRef.current = null;
    setIsLoadingContributions(true);
    try {
      const res = await axiosInstance.get(
        `/auth/github/contributions/${profileUsername}`,
      );
      setContributions(res.data);
      contributionsFetchedForRef.current = githubUsername;
    } catch (err: any) {
      toast.error("Could not refresh contribution data.");
      console.error(
        "Failed to refresh GitHub contributions:",
        err?.response?.data || err?.message,
      );
    } finally {
      setIsLoadingContributions(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const profileShareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/${typeof username === "string" ? username : user.userName}`
      : "";

  if (!mounted) {
    return (
      <UserPageStatic user={initialUser} collections={initialCollections} />
    );
  }

  const isGithubConnected = !!user?.github?.username;

  return (
    <div className="px-4">
      {selectedImage && (
        <ImageLightbox
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <div className="border-x max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="screen-line-bottom">
          <ProfileCard
            user={user}
            isOwner={isOwner}
            isAdmin={isAdmin && !isOwner}
            profileShareLink={profileShareLink}
            onImageClick={setSelectedImage}
          />
        </div>

        {/* Admin Dashboard */}
        {isOwner && isAdmin && (
          <>
            <div className="stripe-divider h-6!" />
            <div className="screen-line-top screen-line-bottom">
              <AdminDashboardCard />
            </div>
          </>
        )}

        {/* GitHub Contribution */}
        {(isGithubConnected || isOwner) && (
          <>
            <div className="stripe-divider h-6!" />
            <div className="screen-line-top screen-line-bottom">
              <div className="max-w-3xl mx-auto px-4 py-6">
                {isGithubConnected && (
                  <GitHubContribution
                    weeks={contributions?.weeks ?? skeletonWeeks}
                    totalContributions={contributions?.totalContributions ?? 0}
                    gh_username={
                      contributions?.username || user?.github?.username || ""
                    }
                    isOwner={isOwner}
                    isLoading={isLoadingContributions}
                    onDisconnect={handleDisconnect}
                    onRefresh={handleRefetchContributions}
                  />
                )}

                {!isGithubConnected && isOwner && (
                  <Card className="group p-6">
                    <div className="flex sm:flex-row flex-col justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted group-hover:bg-emerald-500/10 p-3 rounded-2xl transition-colors">
                          <Github className="w-6 h-6 text-muted-foreground group-hover:text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Showcase your GitHub activity
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Connect your GitHub account to display your
                            contribution graph on your profile.
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
            </div>
          </>
        )}

        {/* Collections */}

        <div className="stripe-divider h-6!" />
        <div className="screen-line-top max-w-3xl mx-auto">
          <CollectionsSection
            collections={collections}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isLoading={isLoadingCollections}
          />
        </div>
      </div>
    </div>
  );
};

export default UserPageClient;
