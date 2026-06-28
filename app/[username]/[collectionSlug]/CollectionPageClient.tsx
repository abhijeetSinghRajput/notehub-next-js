// app/[username]/[collectionSlug]/CollectionPageClient.tsx
"use client";

import CollectionPageSkeleton from "@/components/sekeletons/CollectionPageSkeleton";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import { Forbidden, NotFound } from "@/components/collection/ErrorStates";
import { CollectionHeader } from "@/components/CollectionHeader";
import { ICollection, INote, IUser } from "@/types/model";
import {
  FileText,
  MoreHorizontal,
  Settings,
  Users,
  Trash2,
  Globe,
  Lock,
  Hash,
  Check,
  X,
  Loader2,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BaseCollaboratorsDialog } from "@/components/CollaboratorsDialog";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SortSelector from "@/components/SortSelector";
import { ArticleItem } from "@/components/article-item";

interface User {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectionPageClientProps {
  initialData?: {
    _id: string;
    name: string;
    slug: string;
    visibility: "public" | "private";
    createdAt: string;
    updatedAt: string;
    userId: User;
    collaborators: User[];
    notes: INote[];
    noteCount: number;
  };
  error?: number;
}

const RenderScoreRing = ({
  score,
  className,
}: {
  score: number;
  className?: string;
}) => {
  const r = 14;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;

  let strokeColor = "stroke-emerald-500";

  if (score < 50) strokeColor = "stroke-rose-500";
  else if (score < 90) strokeColor = "stroke-amber-500";

  return (
    <svg
      className={cn("size-8 shrink-0", className)}
      viewBox="0 0 36 36"
      aria-label={`${score} out of 100`}
    >
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="var(--background)"
        className="stroke-border"
        strokeWidth="3"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="var(--background)"
        className={`${strokeColor} transition-all duration-500`}
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        className="fill-foreground text-[9px] font-medium"
      >
        {score}
      </text>
    </svg>
  );
};

const CollectionPageClient = ({
  initialData,
  error: initialError,
}: CollectionPageClientProps) => {
  const params = useParams<{
    username: string;
    collectionSlug: string;
  }>();
  const username = params?.username ?? "";
  const collectionSlug = params?.collectionSlug?.toLowerCase() ?? "";

  const [collection, setCollection] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [errorStatus, setErrorStatus] = useState<number | null>(
    initialError || null,
  );
  const [sortBy, setSortBy] = useState("created");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [collectionShareLink, setCollectionShareLink] = useState("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    status,
    renameCollection,
    updateCollectionVisibility,
    deleteCollection,
    updateCollectionCollaborators,
  } = useNoteStore();
  const { authUser } = useAuthStore();
  const router = useRouter();

  const isOwner =
    !!authUser && authUser.userName.toLowerCase() === username.toLowerCase();
  const isAdmin = authUser?.role === "admin";
  const hasManagementAccess = isOwner || isAdmin;

  // Use either owner data from store or fetched data for guests
  const author = isOwner ? authUser : collection?.userId;

  const notes = useMemo(() => collection?.notes || [], [collection]);

  // Sort notes
  const sortedNotes = useMemo(() => {
    if (!notes.length) return [];

    const notesCopy = [...notes];
    const modifier = sortDirection === "asc" ? 1 : -1;

    const sortFunctions: Record<string, (a: any, b: any) => number> = {
      created: (a, b) =>
        modifier *
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      updated: (a, b) =>
        modifier *
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
      name: (a, b) => modifier * a.name.localeCompare(b.name),
    };

    return notesCopy.sort(sortFunctions[sortBy]);
  }, [notes, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    visibility: "private" as "public" | "private",
  });

  const [manualSlug, setManualSlug] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Sync formData with collection
  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name || "",
        slug: collection.slug || "",
        visibility: collection.visibility || "private",
      });
    }
  }, [collection]);

  // Auto-slug generation
  useEffect(() => {
    if (!manualSlug && isSettingsOpen && formData.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(formData.name),
      }));
    }
  }, [formData.name, manualSlug, isSettingsOpen]);

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug.trim() || !collection) {
      setIsSlugAvailable(null);
      return;
    }

    if (formData.slug === collection.slug) {
      setIsSlugAvailable(true);
      return;
    }

    const checkAvailability = async () => {
      setIsCheckingSlug(true);
      try {
        const res = await axiosInstance.get(
          `/collection/check-availability?slug=${formData.slug}&collectionId=${collection._id}${isAdmin ? `&userId=${collection.userId}` : ""}`,
        );
        setIsSlugAvailable(res.data.available);
      } catch (error) {
        console.error("Slug check failed", error);
        setIsSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [formData.slug, collection, isAdmin]);

  const handleUpdateCollection = async () => {
    if (!formData.name.trim()) return toast.error("Name cannot be empty");
    if (!collection) return;

    setIsSaving(true);
    try {
      await renameCollection({
        _id: collection._id,
        newName: formData.name,
        newSlug: formData.slug !== collection.slug ? formData.slug : undefined,
      });

      if (formData.visibility !== collection.visibility) {
        await updateCollectionVisibility({
          collectionId: collection._id,
          visibility: formData.visibility,
        });
      }

      setIsSettingsOpen(false);

      // If slug changed, redirect
      if (formData.slug !== collection.slug) {
        router.push(`/${username}/${formData.slug}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Update collection failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: collection?.name,
          text: `Check out this collection: ${collection?.name}`,
          url: collectionShareLink,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(collectionShareLink);
      toast.success("Link copied to clipboard");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!username || !collectionSlug) return;

    setCollectionShareLink(
      `${window.location.origin}/${username}/${collectionSlug}`,
    );
  }, [username, collectionSlug]);

  // Fetch data if not provided via props (client-side navigation)
  useEffect(() => {
    const fetchCollection = async () => {
      // Skip if we already have data or if owner (use store)
      if (initialData || isOwner) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorStatus(null);

        // ✅ SINGLE API CALL - gets collection + author + notes + collaborators
        const { data } = await axiosInstance.get(
          `/collection/${username}/${collectionSlug}`,
        );
        setCollection(data.collection);
      } catch (error: any) {
        console.error("Error fetching collection:", error);
        if (error.response) {
          setErrorStatus(error.response.status);
        }
        setCollection(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [username, collectionSlug, initialData, isOwner]);

  // Loading state
  if (isLoading) {
    return <CollectionPageSkeleton />;
  }

  // Error states
  if (errorStatus === 403) return <Forbidden />;
  if (errorStatus === 404 || !collection) return <NotFound />;

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CollectionHeader
            user={author as IUser}
            collection={collection as unknown as ICollection}
            isOwner={isOwner}
            isAdmin={isAdmin}
            shareLink={collectionShareLink}
            onManageCollaborators={() => setIsCollaboratorsOpen(true)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {notes.length > 0 && (
            <SortSelector
              sortBy={sortBy}
              sortDirection={sortDirection}
              setSortBy={setSortBy}
              toggleSortDirection={toggleSortDirection}
            />
          )}

          {hasManagementAccess && (
            <div className="ml-auto flex items-center gap-2">
              <div className="">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-10 w-10 border bg-background/50 backdrop-blur-sm"
                    >
                      <MoreHorizontal className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => setIsSettingsOpen(true)}
                      className="gap-2"
                    >
                      <Settings className="size-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsCollaboratorsOpen(true)}
                      className="gap-2"
                    >
                      <Users className="size-4" />
                      Manage Collaborators
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare} className="gap-2">
                      <Share2 className="size-4" />
                      Share Collection
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="gap-2"
                    >
                      <Trash2 className="size-4" />
                      Delete Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        <div className="screen-line-top border-x relative py-6">
          <div
            className="pointer-events-none absolute inset-0  grid gap-6 sm:gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            <div className="border-r" />
            <div className="border-x" />
            <div className="border-l" />
          </div>

          <section
            className="scroll-mt-20 grid gap-6 sm:gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            {sortedNotes.map((note) => {
              const canViewSeoScore = isOwner || isAdmin;
              const seoScore = note.seo?.score;

              return (
                <article key={note._id} className="relative flex flex-1">
                  {canViewSeoScore && typeof seoScore === "number" && (
                    <RenderScoreRing
                      score={seoScore}
                      className="absolute top-4 right-4 z-10 rounded-full p-0"
                    />
                  )}

                  <ArticleItem
                    note={{
                      ...note,
                      userId: author as unknown as IUser,
                      collectionId: {
                        slug: collectionSlug,
                      } as unknown as ICollection,
                    }}
                  />
                </article>
              );
            })}
          </section>
        </div>

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-5">
            <div className="rounded-full bg-muted p-5">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-semibold">
                {isOwner ? "Start writing your first note" : "No notes yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isOwner
                  ? "This collection is empty. Create a note to start building your knowledge base."
                  : "This collection doesn't have any notes yet. Check back later!"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* --- DIALOGS --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collection Settings</DialogTitle>
            <DialogDescription>
              Update your collection&apos;s basic information and visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between space-x-2 border rounded-md p-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {formData.visibility === "public" ? (
                    <Globe className="size-4 text-primary" />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" />
                  )}
                  <Label className="text-sm font-medium">Public Access</Label>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formData.visibility === "public"
                    ? "Anyone can view this collection."
                    : "Only you and collaborators can view this collection."}
                </p>
              </div>
              <Switch
                checked={formData.visibility === "public"}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    visibility: checked ? "public" : "private",
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Collection name..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setManualSlug(false);
                    setFormData((prev) => ({
                      ...prev,
                      slug: slugify(formData.name),
                    }));
                  }}
                  className={cn(
                    !manualSlug &&
                      "text-primary bg-primary/5 border-primary/20",
                  )}
                >
                  <Hash className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Custom Slug</Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    const val = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-");
                    setFormData((prev) => ({ ...prev, slug: val }));
                    setManualSlug(true);
                  }}
                  placeholder="url-friendly-slug"
                  className={cn(
                    "pr-10",
                    isSlugAvailable === true &&
                      formData.slug !== collection?.slug &&
                      "border-green-500/50 focus-visible:ring-green-500/20",
                    isSlugAvailable === false &&
                      "border-red-500/50 focus-visible:ring-red-500/20",
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isCheckingSlug ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : formData.slug && formData.slug !== collection?.slug ? (
                    isSlugAvailable === true ? (
                      <Check className="size-4 text-green-500" />
                    ) : isSlugAvailable === false ? (
                      <X className="size-4 text-red-500" />
                    ) : null
                  ) : null}
                </div>
              </div>
              {isSlugAvailable === false && (
                <p className="text-[10px] font-medium text-red-500 ml-1">
                  This slug is already taken.
                </p>
              )}
              <p className="text-[10px] text-muted-foreground px-1">
                Changing the slug will change the URL of this collection.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsSettingsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCollection}
              disabled={
                isSaving ||
                (formData.slug !== collection?.slug &&
                  isSlugAvailable === false)
              }
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Delete Collection?</DialogTitle>
            <DialogDescription>
              This will permanently delete the collection and all notes inside
              it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!collection) return;
                setIsSaving(true);
                try {
                  await deleteCollection(collection._id);
                  setIsDeleteDialogOpen(false);
                  router.push(`/${username}`);
                } catch (error) {
                  console.error("Delete failed", error);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseCollaboratorsDialog
        open={isCollaboratorsOpen}
        onOpenChange={setIsCollaboratorsOpen}
        type="collection"
        targetId={collection?._id || ""}
        currentCollaborators={(collection?.collaborators as IUser[]) || []}
        closeDialog={() => setIsCollaboratorsOpen(false)}
        updateNoteCollaborators={async () => {}} // Not used here
        updateCollectionCollaborators={updateCollectionCollaborators}
        isSaving={status.collaborator.state === "saving"}
      />
    </div>
  );
};

export default CollectionPageClient;
