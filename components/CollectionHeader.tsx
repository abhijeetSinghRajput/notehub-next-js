// src > pages > collection > CollectionHeader
import AvatarStack from "@/components/CollaboratorAvatars";
import BadgeIcon from "@/components/icons/BadgeIcon";
import SharePopoverWrapper from "@/components/ShareNotePopover.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImageLightbox from "@/components/ImageLightbox";
import { cn } from "@/lib/utils";
import { ICollection, IUser } from "@/types/model";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AddNoteDialog from "./AddNoteDialog";
import CloudinaryImage from "./ui/cloudinary-image";

interface CollectionHeaderProps {
  user: IUser;
  collection: ICollection;
  isOwner: boolean;
  isAdmin?: boolean;
  shareLink: string;
  onManageCollaborators?: () => void;
}

export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  user,
  collection,
  isOwner,
  isAdmin = false,
  shareLink,
  onManageCollaborators,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!user) return null;

  const hasCollaborators = collection?.collaborators?.length > 0;
  const canManage = isOwner || isAdmin;
  const showCollaboratorSection = canManage || hasCollaborators;

  return (
    <div className="flex w-full flex-col gap-6">
      {selectedImageIndex !== null && (
        <ImageLightbox
          slides={[
            { src: user?.avatar || "/avatar.svg", alt: "Profile photo" },
          ]}
          index={selectedImageIndex ?? 0}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
      {/* User Profile Section */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4">
          <Link
            href={`/${user?.userName}`}
            className="flex flex-row items-center w-max gap-4 group transition-all"
          >
            <div className="relative size-14 shrink-0 rounded-full p-1 border-2 border-primary/10 group-hover:border-primary/30 transition-all">
              <div className="relative size-full rounded-full overflow-hidden">
                <CloudinaryImage
                  src={user.avatar || "/avatar.svg"}
                  alt={user?.fullName || "user"}
                  fill
                  sizes="56px"
                  className="object-cover transition-transform group-hover:scale-105"
                  preload
                  fetchPriority="high"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="font-bold flex gap-2 items-center text-lg text-foreground leading-tight">
                <span>{user?.fullName}</span>
                {user?.role === "admin" && (
                  <BadgeIcon className="size-5 text-blue-500" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                @{user?.userName}
              </span>
            </div>
          </Link>
        </div>
        <SharePopoverWrapper shareLink={shareLink} triggerVariant="ghost" />
      </div>

      {collection && (
        <div className="space-y-6">
          {/* Collaborators Section - Only shown to owner or collaborators */}
          {showCollaboratorSection && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-muted-foreground font-medium">
                  Collaborators
                </h4>
                {canManage && (
                  <Button
                    tooltip="Add collaborators"
                    size="sm"
                    variant="ghost"
                    className="rounded-full h-8 w-8 p-0 hover:bg-muted"
                    onClick={onManageCollaborators}
                    aria-label="Add collaborators"
                  >
                    {hasCollaborators ? (
                      <Pencil className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {hasCollaborators ? (
                <div 
                  className={cn(
                    "flex items-center gap-3 transition-all",
                    canManage && "cursor-pointer hover:opacity-80 group"
                  )}
                  onClick={canManage ? onManageCollaborators : undefined}
                >
                  <AvatarStack
                    collaborators={collection.collaborators as IUser[]}
                    maxVisible={4}
                    size="lg"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Add collaborators to work together on this collection
                </p>
              )}
            </div>
          )}

          {/* Collection Title Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col items-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {collection?.name}
              </h1>
              <Badge
                variant="secondary"
                className="px-3 py-1 whitespace-nowrap text-sm font-medium"
              >
                {collection?.notes?.length || 0}{" "}
                {collection?.notes?.length === 1 ? "Note" : "Notes"}
              </Badge>
            </div>

            {isOwner && (
              <AddNoteDialog
                defaultCollection={collection as ICollection}
                trigger={
                  <Button className="gap-2 mt-1">
                    <Plus className="h-4 w-4" />
                    Add Note
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
