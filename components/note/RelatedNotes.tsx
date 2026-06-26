"use client";

import { ArticleItem } from "@/components/article-item";
import { ArticleCardSkeleton } from "@/components/ArticleCardSkeleton";
import type { INote } from "@/types/model";

interface RelatedNotesProps {
  notes: INote[];
  loading: boolean;
}

export default function RelatedNotes({
  notes,
  loading,
}: RelatedNotesProps) {
  if (!loading && notes.length === 0) return null;

  return (
    <section className="screen-line-top border-border">
      <div className="stripe-divider" />

      <h2
        id="related-articles"
        className="screen-line-top screen-line-bottom ml-4 font-heading text-3xl/none font-medium tracking-tight"
      >
        Related Articles
      </h2>

      <div className="screen-line-top relative py-6">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-x" />
          <div className="border-x" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <ArticleCardSkeleton key={i} />
              ))
            : notes.map((note) => (
                <ArticleItem key={note._id} note={note} />
              ))}
        </div>
      </div>
    </section>
  );
}