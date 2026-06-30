"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Library } from "lucide-react";
import { CollectionSkeleton } from "@/components/sekeletons/ProfilePageSkeleton";
import CollectionCard from "@/components/CollectionCard";
import SortSelector from "@/components/SortSelector";
import WritingTipsCard from "@/components/WritingTipsCard";
import AddNoteDialog from "@/components/AddNoteDialog";
import { ICollection } from "@/types/model";
import { useLocalStorage } from "@/app/stores/useLocalStorage";

interface CollectionsSectionProps {
  collections: ICollection[];
  isOwner: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const CollectionsSection = ({
  collections,
  isOwner,
  isAdmin,
  isLoading,
}: CollectionsSectionProps) => {
  const [sortBy, setSortBy] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const { pinnedCollections } = useLocalStorage();

  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  const pinnedSet = React.useMemo(
    () => new Set(pinnedCollections),
    [pinnedCollections],
  );

  const sortedCollections = React.useMemo(() => {
    if (!collections?.length) return [];
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...collections].sort((a, b) => {
      const ap = pinnedSet.has(a._id);
      const bp = pinnedSet.has(b._id);
      if (ap !== bp) return ap ? -1 : 1;
      switch (sortBy) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "created":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "updated":
          return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        default:
          return 0;
      }
    });
  }, [collections, pinnedSet, sortBy, sortDirection]);

  if (isLoading) return <CollectionSkeleton />;

  if (!collections.length) {
    return (
      <div className="flex flex-col items-center gap-6">
        <Card className="py-16 w-full rounded-none">
          <CardContent className="flex flex-col items-center text-center gap-4 p-6">
            <div className="rounded-full bg-muted p-4">
              <Library className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {isOwner ? "Create your first collection" : "No collections yet"}
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
    );
  }

  return (
    <>
      <div className="p-4 flex justify-between items-center screen-line-bottom">
        <div>
          <h2 className="text-2xl font-bold">Collections</h2>
          <p className="text-sm text-muted-foreground">
            {collections.length}{" "}
            {collections.length === 1 ? "collection" : "collections"}
          </p>
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
            isAdmin={isAdmin}
            pinnedCollections={pinnedCollections}
          />
        ))}
      </div>
    </>
  );
};

export default CollectionsSection;