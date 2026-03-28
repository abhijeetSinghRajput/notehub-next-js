// components/article-card/ArticleCard.tsx
"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { ChevronRight, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/app/stores/useAuthStore";
import NotesOption from "@/components/NotesOption";
import { ICollection, INote, IUser } from "@/types/model";

import { AuthorInfo } from "./AuthorInfo";
import { NoteTitle } from "./NoteTitle";
import { ImageCarousel } from "./ImageCarousel";
import { TocSection } from "./TocSection";

interface ImageData {
  src: string;
  alt: string;
}

interface ArticleCardProps {
  note: INote;
  author: IUser;
  images: ImageData[];
  collection: ICollection;
  headings: INote["tableOfContent"];
  description: string;
}

export const ArticleCard = memo<ArticleCardProps>(function ArticleCard({
  note,
  author,
  images,
  collection,
  description,
}) {
  const authUser = useAuthStore((state) => state.authUser);
  const [isRenaming, setIsRenaming] = useState(false);

  const isOwner = author?.userName === authUser?.userName;

  const noteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/${author?.userName}/${collection.slug}/${note.slug}`;
  const noteHref = `/${author?.userName}/${collection.slug}/${note.slug}`;
  const collectionHref = `/${author?.userName}/${collection.slug}`;

  return (
    <Card className="w-full rounded-xl sm:rounded-2xl border-t border-border lg:border p-4 lg:p-6">
      {/* ── Header: author info + rename input + options menu ── */}
      <CardHeader className="p-0 mb-3 flex flex-row justify-between items-center">
        {isRenaming ? (
          <NoteTitle
            note={note}
            isRenaming={isRenaming}
            onRename={setIsRenaming}
          />
        ) : (
          <AuthorInfo
            author={author}
            note={note}
            collection={collection}
            isOwner={isOwner}
          />
        )}

        {isOwner && (
          <NotesOption
            trigger={<MoreVertical className="size-4" />}
            className="size-10 rounded-full"
            note={note}
            setIsRenaming={setIsRenaming}
          />
        )}
      </CardHeader>

      {/* ── Body: text + optional image carousel ── */}
      <CardContent className="p-0">
        <div className="flex flex-col items-start md:flex-row gap-4">
          {/* Left: title, TOC, description, CTA */}
          <div className="flex-1 w-full">
            <CardTitle>
              <h2 className="text-base sm:text-xl font-semibold mb-2">
                <Link
                  href={collectionHref}
                  className="text-muted-foreground hover:underline"
                >
                  {collection.name}
                </Link>
                {" / "}
                <Link href={noteHref} className="hover:underline">
                  {note.name}
                </Link>
              </h2>
            </CardTitle>

            <TocSection
              noteLink={noteLink}
              headings={note.tableOfContent}
            />

            <p className="text-muted-foreground text-sm line-clamp-3">
              {description}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-primary/10"
              >
                <Link
                  href={noteHref}
                  aria-label={`Read more about ${note.name}`}
                >
                  <span className="sr-only">{`Read more about ${note.name}`}</span>
                  <span aria-hidden="true">Read More</span>
                  <ChevronRight />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: image carousel */}
          {images?.length > 0 && <ImageCarousel images={images} />}
        </div>
      </CardContent>
    </Card>
  );
});