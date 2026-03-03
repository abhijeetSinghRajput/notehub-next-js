"use client";
import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { ArticleCard } from "@/components/ArticleCard";
import { getCanonicalUrl, noteToArticle } from "@/lib/utils";
import { ArticleCardSkeleton } from "@/components/ArticleCardSkeleton";
import { CheckCircle2 } from "lucide-react";
import { PopulatedNote } from "@/types/model";
import OnboardingCard from "@/components/OnboardingCard";
import WritingTipsCard from "@/components/WritingTipsCard";

const HomePage = () => {
  const loaderRef = useRef(null);
  const { notes, pagination, getPublicNotes, status } = useNoteStore();
  const { authUser } = useAuthStore();
  const isGuest = !authUser;

  // Transform notes with proper fallbacks
  const articles = useMemo(
    () => notes.map((note) => noteToArticle(note as PopulatedNote)),
    [notes],
  );

  // Infinite scroll handler
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        status.note.state !== "loading" &&
        pagination.hasMore
      ) {
        getPublicNotes({
          page: pagination.currentPage + 1,
          limit: 10,
        });
      }
    },
    [pagination, getPublicNotes],
  );

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 0.1,
    });

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  // Initial load
  useEffect(() => {
    if (notes.length === 0) {
      getPublicNotes({ page: 1, limit: 10 });
    }
  }, []);

  return (
    <div className="p-2">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>

      {isGuest ? (
        <>
          {/* Mobile: onboarding card on top */}
          <div className="flex flex-col gap-4 mb-6 w-full lg:hidden">
            <OnboardingCard  />
          </div>

          {/* Desktop: feed left + onboarding card pinned right */}
          <div className="flex gap-6 max-w-6xl mx-auto">
            <div className="flex-1 space-y-3 sm:space-y-4 max-w-5xl">
              {articles.map((note, index) => (
                <ArticleCard
                  key={note._id || index}
                  note={note}
                  description={note.article.description}
                  images={note.article.images}
                  author={note.userId}
                  collection={note.collectionId}
                  headings={note.article.headings}
                />
              ))}

              {status.note.state === "loading" &&
                [...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} />)}

              <div ref={loaderRef} className="h-1" />

              {!pagination.hasMore && notes.length > 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="relative bg-muted rounded-full p-4 shadow-lg">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">
                    You've reached the end
                  </h3>
                  <p className="mt-2 text-center text-muted-foreground max-w-md">
                    That's all for now. Check back later for more content.
                  </p>
                </div>
              )}
            </div>

            {/* Right sidebar — hidden on small screens */}
            <aside className="hidden lg:flex flex-col gap-4 w-full max-w-sm shrink-0 sticky top-18 self-start">
              <OnboardingCard />
            </aside>
          </div>
        </>
      ) : (
        <>
          {/* Mobile: writing tips on top */}
          <div className="flex flex-col gap-4 mb-6 w-full lg:hidden">
            <WritingTipsCard defaultOpen={false} />
          </div>

          {/* Desktop: feed left + writing tips pinned right */}
          <div className="flex gap-6 max-w-6xl mx-auto">
            <div className="flex-1 space-y-3 sm:space-y-4 max-w-5xl">
          {articles.map((note, index) => (
            <ArticleCard
              key={note._id || index}
              note={note}
              description={note.article.description}
              images={note.article.images}
              author={note.userId}
              collection={note.collectionId}
              headings={note.article.headings}
            />
          ))}

          {status.note.state === "loading" &&
            [...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} />)}

          <div ref={loaderRef} className="h-1" />

          {!pagination.hasMore && notes.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative bg-muted rounded-full p-4 shadow-lg">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">
                You've reached the end
              </h3>
              <p className="mt-2 text-center text-muted-foreground max-w-md">
                That's all for now. Check back later for more content.
              </p>
            </div>
          )}
            </div>

            {/* Right sidebar — hidden on small screens */}
            <aside className="hidden lg:flex flex-col gap-4 w-full max-w-sm shrink-0 sticky top-18 self-start">
              <WritingTipsCard />
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
