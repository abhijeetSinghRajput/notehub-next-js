// src > pages > collection > CollectionHeader
import AvatarStack from "@/components/CollaboratorAvatars";
import BadgeIcon from "@/components/icons/BadgeIcon";
import SharePopoverWrapper from "@/components/ShareNotePopover.client";
import TooltipWrapper from "@/components/TooltipWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImageLightbox from "@/components/ImageLightbox";
import { useCollaboratorManager } from "@/contex/CollaboratorManagerContext";
import { ICollection, IUser } from "@/types/model";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AddNoteDialog from "./AddNoteDialog";
import Image from "next/image";

interface CollectionHeaderProps {
  user: IUser;
  collection: ICollection;
  isOwner: boolean;
  shareLink: string;
}

export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  user,
  collection,
  isOwner,
  shareLink,
}) => {
  if (!user) return null;
  const { openDialog } = useCollaboratorManager();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const hasCollaborators = collection?.collaborators?.length > 0;
  const showCollaboratorSection = isOwner || hasCollaborators;

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
          <div className="relative size-10 shrink-0 rounded-full overflow-hidden">
            <Image
              src={user.avatar || "/avatar.svg"}
              alt={user?.fullName || "User"}
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <Link href={`/${user?.userName}`} className="block">
              <h2 className="flex gap-2.5 items-center text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                {user?.fullName}
                {user.role === "admin" && (
                  <BadgeIcon className="size-4 sm:size-5 text-blue-500" />
                )}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground transition-colors">
                @{user?.userName}
              </p>
            </Link>
          </div>
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
                {isOwner && (
                  <Button
                    tooltip="Add collaborators"
                    size="sm"
                    variant="ghost"
                    className="rounded-full h-8 w-8 p-0 hover:bg-muted"
                    onClick={() =>
                      openDialog(
                        collection?.collaborators || [],
                        collection?._id,
                        "collection",
                      )
                    }
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
                <div className="flex items-center gap-3">
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
