import { cn, format } from "@/lib/utils";
import { INote } from "@/types/model";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import CloudinaryImage from "./ui/cloudinary-image";
import BadgeIcon from "./icons/BadgeIcon";
import BlogCoverCard from "./BlogCoverCard";

export function ArticleItem({ note }: { note: INote }) {

  const author = typeof note.userId === "object" ? note.userId : null;
  const collection =
    typeof note.collectionId === "object" ? note.collectionId : null;

  if (!author || !collection) return null;

  const url = `/${author.userName}/${collection.slug}/${note.slug}`;

  const displayTitle = note.seo?.title || note.name;
  const coverUrl = note.seo?.image?.url ?? null;

  return (
    <>
      <Link
        href={url}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-[background-color] ease-out hover:bg-accent/30",
          "screen-line-top screen-line-bottom",
        )}
      >
        {/* Cover — image if available, BlogCoverCard as fallback */}
        <div className="relative aspect-video w-full cursor-pointer overflow-hidden">
          {coverUrl ? (
            <>
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
              {collection.name && (
                <div
                  className="absolute top-3 left-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge variant="secondary">{collection.name}</Badge>
                </div>
              )}
            </>
          ) : (
            <BlogCoverCard
              id={note._id}
              category={collection.name}
              title={note.name}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-2">
          {/* title + description */}
          <div className="group/link flex-1">
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
              <CloudinaryImage
                src={author?.avatar || "/avatar.svg"}
                alt={author?.fullName || "User Profile Photo"}
                width={24}
                height={24}
                className="rounded-full object-cover shrink-0"
                loading="lazy"
                fetchPriority="low"
              />
              <div>
                <div className="flex gap-2 items-center text-sm font-medium text-muted-foreground/60">
                  {author && (
                    <span className="truncate">
                      {author.fullName ?? author.userName}
                    </span>
                  )}
                  {author.role === "admin" && (
                    <span className="size-3.5 text-blue-500 flex items-center justify-center">
                      <BadgeIcon />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-xs whitespace-nowrap font-medium text-muted-foreground/60">
              {format(new Date(note.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </Link>
    </>
  );
}
