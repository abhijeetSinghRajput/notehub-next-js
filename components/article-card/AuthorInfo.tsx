// components/article-card/AuthorInfo.tsx
import Link from "next/link";
import { Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BadgeIcon from "@/components/icons/BadgeIcon";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import { formatTimeAgo } from "@/lib/utils";
import type { ICollection, INote, IUser } from "@/types/model";

interface AuthorInfoProps {
  author: IUser;
  note: INote;
  collection: ICollection;
  isOwner: boolean;
}

export function AuthorInfo({ author, note, collection, isOwner }: AuthorInfoProps) {
  const isPublic =
    note.visibility === "public" && collection.visibility === "public";

  return (
    <Link
      href={`/${author?.userName}`}
      className="flex flex-row items-center w-max gap-3"
    >
      <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-muted">
        <CloudinaryImage
          src={author?.avatar || "/avatar.svg"}
          alt={author?.fullName || "User Profile Photo"}
          fill
          sizes="40px"
          className="object-cover"
          loading="lazy"
          fetchPriority="low"
        />
      </div>

      <div className="flex flex-col">
        <div className="font-semibold flex gap-2 items-center text-sm">
          <span>{author?.fullName}</span>

          {author.role === "admin" && (
            <span className="size-4 text-blue-500 flex items-center justify-center">
              <BadgeIcon />
            </span>
          )}

          {isOwner && (
            <Badge
              variant="ghost"
              className="p-1 border-none text-muted-foreground"
            >
              {isPublic ? (
                <Globe className="size-4!" />
              ) : (
                <Lock className="size-4! fill-destructive/20 stroke-destructive" />
              )}
            </Badge>
          )}
        </div>

        <span className="text-sm text-muted-foreground">
          {`@${author?.userName}`} •{" "}
          {formatTimeAgo(note.contentUpdatedAt?.toString?.() ?? "")}
        </span>
      </div>
    </Link>
  );
}