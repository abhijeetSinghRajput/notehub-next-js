import { cn, formatTimeAgo } from "@/lib/utils";
import { INote } from "@/types/model";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import CloudinaryImage from "./ui/cloudinary-image";
import { Globe, Lock } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useState } from "react";
import BadgeIcon from "./icons/BadgeIcon";

export function ArticleItem({ note }: { note: INote }) {
  const { authUser } = useAuthStore();
  const [isRenaming, setIsRenaming] = useState(false);

  const author = typeof note.userId === "object" ? note.userId : null;
  const collection =
    typeof note.collectionId === "object" ? note.collectionId : null;

  if (!author || !collection) return null;

  const isOwner = author.userName === authUser?.userName;
  const isPublic = note.visibility === "public" && collection.visibility === "public";

  const url = `/${author.userName}/${collection.slug}/${note.slug}`;
  const collectionHref = `/${author.userName}/${collection.slug}`;

  const displayTitle = note.seo?.title || note.name;
  const coverUrl =
    note.seo?.image?.url ||
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/og-note?${new URLSearchParams({
      title: note.name || "Note",
      authorName: author.fullName || "User",
      authorUsername: `@${author.userName ?? "notehub"}`,
      authorAvatar: author.avatar || "",
      collection: collection.name || "",
    }).toString()}`;
  const createdAt = note.contentUpdatedAt ?? note.createdAt;

  return (
    <>
      <Link
        href={url}
        className={cn(
          "flex flex-col gap-2 p-2 transition-[background-color] ease-out hover:bg-accent/30",
          "max-sm:screen-line-top max-sm:screen-line-bottom",
          "sm:max-md:nth-[2n+1]:screen-line-top sm:max-md:nth-[2n+1]:screen-line-bottom",
          "md:nth-[3n+1]:screen-line-top md:nth-[3n+1]:screen-line-bottom",
        )}
      >
        {/* Image */}
        <div className="relative aspect-video w-full cursor-pointer overflow-hidden">
          <CloudinaryImage
            src={coverUrl}
            alt={displayTitle}
            fill
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 40vw"
            loading="lazy"
            fetchPriority="low"
          />

          {/* gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60" />

          {/* collection badge — top left */}
          <div
            className="absolute top-3 left-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge variant="secondary" asChild>
              <Link href={collectionHref}>{collection.name}</Link>
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-2">
          {/* title + description */}
          <div className="group/link">
            <h2 className="mb-2 text-base font-medium leading-snug tracking-tight text-foreground transition duration-300 group-hover:text-primary">
              {displayTitle}
            </h2>
            {note?.seo?.description && (
              <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {note.seo.description}
              </p>
            )}
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="relative">
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
                {author.role === "admin" && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full border-2 border-background size-4.5 text-blue-500 flex items-center justify-center">
                    <BadgeIcon />
                  </span>
                )}
              </div>
              <div>
                <div className="flex gap-2 items-center text-sm">
                  <span className="font-medium">{author?.fullName}</span>

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
                <span className="text-muted-foreground">{author?.userName}</span>
              </div>
            </div>

            <span className="text-muted-foreground/60 inline-flex items-center gap-1.5 text-sm">
              {formatTimeAgo(note.contentUpdatedAt?.toString?.() ?? "")}
            </span>
          </div>
        </div>
      </Link>
    </>
  );
}
