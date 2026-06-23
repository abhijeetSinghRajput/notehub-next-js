"use client";

import Link from "next/link";
import CloudinaryImage from "../ui/cloudinary-image";
import { format } from "@/lib/utils";
import { Label } from "../ui/label";

export interface IRelatedNote {
  _id: string;
  name: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  fullPath: string | null;
  createdAt: string;
  collectionName: string;
  author?: {
    userName: string | null;
    fullName: string | null;
    avatar: string | null;
  } | null;
}

function NoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-36 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3 mt-4" />
      </div>
    </div>
  );
}

function buildOgImageUrl(note: IRelatedNote): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const params = new URLSearchParams({
    title: note.name || "Note",
    authorName: note.author?.fullName || "User",
    authorUsername: `@${note.author?.userName ?? "notehub"}`,
    authorAvatar: note.author?.avatar || "",
    collection: note.collectionName || "",
  });
  return `${base}/api/og-note?${params.toString()}`;
}

function NoteCard({ note }: { note: IRelatedNote }) {
  const coverSrc = note.coverImage || buildOgImageUrl(note);
  const coverAlt = note.coverImageAlt || note.title || note.name;

  return (
    <Link
      href={note.fullPath ? `/${note.fullPath}` : "#"}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-border/80 hover:bg-accent/40 transition-colors duration-150"
    >
      {/* Cover — true 16:9 */}
      <div className="relative w-full aspect-video overflow-hidden">
        <CloudinaryImage
          src={coverSrc}
          alt={coverAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Body */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
          {note.title || note.name}
        </p>
        {note.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {note.excerpt}
          </p>
        )}

        {/* Author */}
        {note.author && (
          <div className="flex items-center gap-2 mt-3 border-border">
            <CloudinaryImage
              src={note.author.avatar || ""}
              alt={note.author.fullName ?? ""}
              width={24}
              height={24}
              className="rounded-full object-cover shrink-0"
            />
            <div className="flex text-xs font-medium text-muted-foreground w-full items-center justify-between">
              <span className="truncate">
                {note.author.fullName ?? note.author.userName}
              </span>
              <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function RelatedNotes({
  notes,
  loading,
}: {
  notes: IRelatedNote[];
  loading: boolean;
}) {
  if (!loading && !notes?.length) return null;

  return (
    <section className="border-border">
      <div className="flex items-center gap-6 pt-20 pb-16">
        <span className="border-b flex-1" />
        <h2 id="related-articles" className="flex items-center gap-2">
          <Label className="text-3xl font-bold">Related Articles</Label>
        </h2>
        <span className="border-b flex-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <NoteCardSkeleton key={i} />
            ))
          : notes.map((note) => <NoteCard key={note._id} note={note} />)}
      </div>
    </section>
  );
}
