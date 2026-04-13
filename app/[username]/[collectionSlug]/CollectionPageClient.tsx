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
import { ICollection, IUser } from "@/types/model";
import NoteCard from "@/components/NoteCard";
import SortSelector from "@/components/SortSelector";
import { FileText } from "lucide-react";

interface CollectionPageClientProps {
  initialData?: {
    collection: ICollection;
    author: IUser;
    message?: string;
  };
  error?: number;
}

const CollectionPageClient = ({ initialData, error: initialError }: CollectionPageClientProps) => {
  const params = useParams<{
    username: string;
    collectionSlug: string;
  }>();

  const username = params?.username ?? "";
  const collectionSlug = params?.collectionSlug?.toLowerCase() ?? "";

  const [collectionData, setCollectionData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [errorStatus, setErrorStatus] = useState<number | null>(initialError || null);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [collectionShareLink, setCollectionShareLink] = useState("");
  
  const { status, collections: ownerCollections } = useNoteStore();
  const { authUser } = useAuthStore();
  
  const isOwner = !!authUser && authUser.userName.toLowerCase() === username.toLowerCase();
  
  // For owner, use store data
  const ownerCollection = useMemo(() => {
    if (isOwner) {
      return ownerCollections.find((c: ICollection) => c.slug === collectionSlug);
    }
    return null;
  }, [isOwner, ownerCollections, collectionSlug]);

  // Use either owner data from store or fetched data for guests
  const collection = isOwner ? ownerCollection : collectionData?.collection;
  const author = isOwner ? authUser : collectionData?.author;
  
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!username || !collectionSlug) return;

    setCollectionShareLink(
      `${window.location.origin}/${username}/${collectionSlug}`,
    );
  }, [username, collectionSlug]);

  // Fetch data if not provided via props (client-side navigation)
  useEffect(() => {
    const fetchCollectionData = async () => {
      // Skip if we already have data or if owner (use store)
      if (initialData || isOwner) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorStatus(null);

        // ✅ SINGLE API CALL - gets collection + author + notes + collaborators
        const response = await axiosInstance.get(`/collection/${username}/${collectionSlug}`);
        
        setCollectionData(response.data);
      } catch (error: any) {
        console.error("Error fetching collection:", error);
        if (error.response) {
          setErrorStatus(error.response.status);
        }
        setCollectionData(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionData();
  }, [username, collectionSlug, initialData, isOwner]);

  // Loading state
  if (status.collection.state === "loading" || isLoading) {
    return <CollectionPageSkeleton />;
  }

  // Error states
  if (errorStatus === 403) return <Forbidden />;
  if (errorStatus === 404 || !collection) return <NotFound />;

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <CollectionHeader
            user={author as IUser}
            collection={collection}
            isOwner={isOwner}
            shareLink={collectionShareLink}
          />
        </div>
        
        {notes.length > 0 && (
          <SortSelector
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            toggleSortDirection={toggleSortDirection}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              isOwner={isOwner}
              username={username}
              collectionSlug={collectionSlug}
            />
          ))}
        </div>

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-5">
            <div className="rounded-full bg-muted p-5">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-semibold">
                {isOwner
                  ? "Start writing your first note"
                  : "No notes yet"}
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
    </div>
  );
};

export default CollectionPageClient;