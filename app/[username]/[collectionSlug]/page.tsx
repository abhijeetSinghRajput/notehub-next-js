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
import SortSelector from "@/components/SortSelector"

const CollectionPage = () => {
  const params = useParams<{
    username: string;
    collectionSlug: string;
  }>();

  const username = params?.username ?? "";
  const collectionSlug = params?.collectionSlug?.toLowerCase() ?? "";

  const [user, setUser] = useState<IUser | null>(null);
  const [guestCollection, setGuestCollection] = useState<ICollection | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null); // Track error status
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { status, collections: ownerCollections } = useNoteStore();
  const { authUser } = useAuthStore();
  const isOwner =
    !!authUser && authUser.userName.toLowerCase() === username.toLowerCase();
  const collection = useMemo(() => {
    if (isOwner) {
      return ownerCollections.find(
        (c: ICollection) => c.slug === collectionSlug,
      );
    }
    return guestCollection;
  }, [isOwner, ownerCollections, collectionSlug, guestCollection]);

  const notes = useMemo(() => collection?.notes || [], [collection]);
  const sortedNotes = useMemo(() => {
    if (!notes) return [];

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

  const getCollection = async ({
    userId,
    slug,
  }: {
    userId: string;
    slug: string;
  }): Promise<ICollection | null> => {
    try {
      const res = await axiosInstance.get("/collection", {
        params: {
          userId,
          slug,
        },
      });
      const { collection } = res.data;
      return collection;
    } catch (error: any) {
      if (error.response) {
        setErrorStatus(error.response.status);
      }
      console.error(error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorStatus(null);

        if (!isOwner) {
          const response = await axiosInstance.get(`user/${username}`);
          const collectionsData = await getCollection({
            userId: response.data?._id,
            slug: collectionSlug,
          });

          setGuestCollection(collectionsData);
          setUser(response.data);
        } else {
          setUser(authUser);
        }
      } catch (error: any) {
        console.error("Error fetching profile data:", error);
        setUser(null);
        setGuestCollection(null);
        if (error.response) {
          setErrorStatus(error.response.status);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, collectionSlug, isOwner, authUser]);

  if (status.collection.state === "loading" || isLoading)
    return <CollectionPageSkeleton />;

  if (errorStatus === 403) return <Forbidden />;
  if (errorStatus === 404 || !collection) return <NotFound />;

  return (
    <div className="px-4 py-8 min-h-svh">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <CollectionHeader
            user={user as IUser}
            collection={collection}
            isOwner={isOwner}
          />
        </div>
        <SortSelector
          sortBy={sortBy}
          sortDirection={sortDirection}
          setSortBy={setSortBy}
          toggleSortDirection={toggleSortDirection}
        />

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
      </div>
    </div>
  );
};

export default CollectionPage;
