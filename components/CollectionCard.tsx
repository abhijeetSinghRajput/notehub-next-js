import { Bookmark, Lock, MoreVertical, Pin } from "lucide-react";
import React, { useRef, useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Badge } from "./ui/badge";
import CollectionsOption from "./CollectionsOption";
import { Button } from "./ui/button";
import TooltipWrapper from "./TooltipWrapper";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { format } from "@/lib/utils";
import AvatarStack from "./CollaboratorAvatars";
import { usePathname } from "next/navigation";
import FolderIcon from "./icons/FolderIcon";
import { ICollection, IUser } from "@/types/model";

interface CollectionCardProps {
  collection: ICollection;
  isOwner: boolean;
  pinnedCollections: string[];
}

function CollectionCard({ collection, isOwner, pinnedCollections }: CollectionCardProps) {
  const [isCollectionRenaming, setIsCollectionRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { renameCollection } = useNoteStore();

  const handleRenameStart = () => {
    setIsCollectionRenaming(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 200);
  };

  const handleRenameSave = () => {
    const newName = inputRef.current?.value.trim();
    if (newName && newName !== collection.name) {
      renameCollection({
        _id: collection._id,
        newName: newName,
      });
    }
    setIsCollectionRenaming(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation to prevent collapsible toggle
    e.stopPropagation();
    if (e.key === "Enter") {
      handleRenameSave();
    }
  };

  const handleInputBlur = () => {
    handleRenameSave();
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Stop propagation to prevent collapsible toggle
    e.stopPropagation();
  };

  const isPinned = (collectionId:string) => {
    return pinnedCollections.includes(collectionId);
  };

  return (
    <Card
      key={collection._id}
      className={cn(
        "group rounded-none bg-transparent border-0 border-b hover:shadow-md hover:bg-muted/30 transition-all",
      )}
    >
      <div className="flex items-center gap-2 justify-between p-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="relative">
            {isPinned(collection._id) && (
              <Bookmark
                className={cn(
                  "h-5 w-5 mt-1 absolute -bottom-1 -right-1 fill-primary stroke-primary",
                )}
              />
            )}

            <FolderIcon className="size-12 opacity-70" />
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                {isCollectionRenaming ? (
                  <Input
                    className="font-semibold bg-input/30"
                    defaultValue={collection.name}
                    ref={inputRef}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    onClick={handleInputClick}
                  />
                ) : (
                  <TooltipWrapper message={collection.name}>
                    <Link
                      href={`${pathname}/${collection.slug}`}
                      className="hover:underline font-medium line-clamp-2"
                    >
                      {collection.name}
                    </Link>
                  </TooltipWrapper>
                )}
              </div>

              {isOwner && (
                <CollectionsOption
                  trigger={
                    <Button
                      variant="ghost"
                      aria-label="Open collection options menu"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Collection Option</span>
                    </Button>
                  }
                  collection={collection}
                  onRenameStart={handleRenameStart}
                />
              )}
            </div>
            <div className="flex gap-2 justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-1">
                  {collection.notes?.length}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Created{" "}
                  {format(new Date(collection.createdAt), "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex justify-between items-center gap-4">
                {Array.isArray(collection.collaborators) && (
                  <AvatarStack
                    collaborators={collection.collaborators as IUser[]}
                    maxVisible={3}
                    size="sm"
                  />
                )}
                {isOwner && collection.visibility === "private" && (
                  <Badge
                    variant={"destructive"}
                    className="flex items-center gap-1 h-auto"
                  >
                    <Lock className="size-3.5" />
                    {collection.visibility}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CollectionCard;
