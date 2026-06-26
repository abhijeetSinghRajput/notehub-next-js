"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import CloudinaryImage from "@/components/ui/cloudinary-image";
import ImageLightbox from "@/components/ImageLightbox";

import { useAuthStore } from "@/app/stores/useAuthStore";
import NotesOption from "@/components/NotesOption";
import { INote } from "@/types/model";

import { AuthorInfo } from "./AuthorInfo";
import { NoteTitle } from "./NoteTitle";
import { formatTimeAgo } from "@/lib/utils";

interface ImageData {
  src: string;
  alt: string;
}

function buildOgImageUrl(note: INote) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const author = typeof note.userId === "object" ? note.userId : null;
  const collection =
    typeof note.collectionId === "object" ? note.collectionId : null;

  const params = new URLSearchParams({
    title: note.name || "Note",
    authorName: author?.fullName || "User",
    authorUsername: `@${author?.userName ?? "notehub"}`,
    authorAvatar: author?.avatar || "",
    collection: collection?.name || "",
  });

  return `${base}/api/og-note?${params.toString()}`;
}

export const ArticleCard = memo(function ArticleCard({
  note,
}: {
  note: INote;
}) {
  const authUser = useAuthStore((state) => state.authUser);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const author = typeof note.userId === "object" ? note.userId : null;
  const collection =
    typeof note.collectionId === "object" ? note.collectionId : null;

  if (!author || !collection) return null;

  const isOwner = author.userName === authUser?.userName;
  const noteHref = `/${author.userName}/${collection.slug}/${note.slug}`;
  const collectionHref = `/${author.userName}/${collection.slug}`;
  const displayTitle = note.seo?.title || note.name;
  const displayDescription = note.seo?.description || note.name;
  const displayImage: ImageData = {
    src: note.seo?.image?.url || buildOgImageUrl(note),
    alt: note.seo?.image?.alt || displayTitle,
  };

  return (
    <>
      <Card className="group relative flex flex-col overflow-hidden rounded-2xl border-border/60 bg-card/80 p-0 shadow-sm backdrop-blur-sm transition duration-300 hover:border-primary/20 hover:bg-accent/50 hover:shadow-md">
        {/* Image */}
        <div
          className="relative aspect-video w-full cursor-pointer overflow-hidden"
          onClick={() => setShowLightbox(true)}
        >
          <CloudinaryImage
            src={displayImage.src}
            alt={displayImage.alt}
            fill
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 40vw"
            loading="lazy"
            fetchPriority="low"
          />

          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60" />

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

        {/* Body */}
        <CardContent className="flex flex-1 flex-col px-5 pt-4 pb-5">
          {/* author row or rename input */}
          <div className="mb-3">
            {isRenaming ? (
              <NoteTitle
                note={note}
                isRenaming={isRenaming}
                onRename={setIsRenaming}
              />
            ) : (
              <div className="flex gap-2 justify-between items-center">
                <AuthorInfo
                  author={author}
                  note={note}
                  collection={collection}
                  isOwner={isOwner}
                />
                {/* owner options — top right */}
                {isOwner && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <NotesOption
                      trigger={<MoreVertical className="size-4" />}
                      className="size-10 rounded-full"
                      note={note}
                      setIsRenaming={setIsRenaming}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* title + description */}
          <Link href={noteHref} className="group/link">
            <h2 className="mb-2 text-base font-semibold leading-snug tracking-tight text-foreground transition duration-300 group-hover:text-primary">
              {displayTitle}
            </h2>
            <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {displayDescription}
            </p>
          </Link>

          {/* footer row */}
          <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
            <span className="text-muted-foreground/50 inline-flex items-center gap-1.5 text-xs">
              <Clock className="size-3" aria-hidden="true" />
              {formatTimeAgo(note.contentUpdatedAt?.toString?.() ?? "")}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground/50 group-hover:text-primary h-auto gap-1 p-0 text-xs font-medium transition duration-300"
              asChild
            >
              <Link href={noteHref}>
                Read
                <ArrowRight
                  className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {showLightbox && (
        <ImageLightbox
          slides={[displayImage]}
          index={0}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
});
