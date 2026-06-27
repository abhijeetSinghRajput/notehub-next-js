import { ArrowUpRight, Bookmark, Lock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "@/lib/utils";
import AvatarStack from "./CollaboratorAvatars";
import { usePathname } from "next/navigation";
import FolderIcon from "./icons/FolderIcon";
import { ICollection, IUser } from "@/types/model";

interface CollectionCardProps {
  collection: ICollection;
  isOwner: boolean;
  isAdmin: boolean;
  pinnedCollections: string[];
}

function CollectionCard({
  collection,
  isOwner,
  isAdmin,
  pinnedCollections,
}: CollectionCardProps) {
  const pathname = usePathname();

  const isPinned = (collectionId: string) => {
    return pinnedCollections.includes(collectionId);
  };

  return (
    <Link
      href={`${pathname}/${collection.slug}`}
      key={collection._id}
      className={"group p-4 w-full border-b hover:bg-card flex justify-between"}
    >
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
          <div className="flex items-center w-full justify-between gap-2">
            <div className="font-medium line-clamp-2">{collection.name}</div>
            <ArrowUpRight
              className="size-4 text-muted-foreground/80 group-hover:text-foreground 
              transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center w-full">
          <div className="text-xs text-muted-foreground/80 flex items-center gap-2">
            <span>{collection.notes?.length}</span>
            <p>{format(new Date(collection.createdAt), "MMM d, yyyy")}</p>
          </div>

          <div className="flex justify-between items-center gap-4">
            {Array.isArray(collection.collaborators) && (
              <AvatarStack
                collaborators={collection.collaborators as IUser[]}
                maxVisible={3}
                size="sm"
              />
            )}
            {(isOwner || isAdmin) && collection.visibility === "private" && (
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
    </Link>
  );
}

export default CollectionCard;
