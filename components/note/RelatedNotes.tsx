"use client";

import Link from "next/link";
import Image from "next/image";

export interface IRelatedNote {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  fullPath: string | null;
  createdAt: string;
}

function NoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-36 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

function PlaceholderCover({ title }: { title: string }) {
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="h-36 bg-muted flex items-center justify-center">
      <span className="text-2xl font-semibold text-muted-foreground select-none">
        {initials}
      </span>
    </div>
  );
}

function NoteCard({ note }: { note: IRelatedNote }) {
  return (
    <Link
      href={note.fullPath ? `/${note.fullPath}` : "#"}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-border/80 hover:bg-accent/40 transition-colors duration-150"
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden">
        {note.coverImage ? (
          <Image
            src={note.coverImage}
            alt={note.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <PlaceholderCover title={note.title} />
        )}
      </div>

      {/* Body */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
          {note.title}
        </p>
        {note.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {note.excerpt}
          </p>
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
    <section className="mt-16 border-t border-border pt-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          More like this
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <NoteCardSkeleton key={i} />
            ))
          : notes.map((note) => <NoteCard key={note._id} note={note} />)}
      </div>
    </section>
  );
}