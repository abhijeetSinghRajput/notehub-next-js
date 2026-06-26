"use client";
import { useEffect, useCallback, useRef, useState } from "react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { ArticleCardSkeleton } from "@/components/ArticleCardSkeleton";
import { ArrowRight, Bookmark, CheckCircle2 } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import HomePageStatic from "./HomePageStatic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { ArticleItem } from "@/components/article-item";

type Props = {
  initialData?: any;
};

const HomePageClient = ({ initialData }: Props) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const { notes, pagination, getPublicNotes, status, setNotes, setPagination } =
    useNoteStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate store with server data
  useEffect(() => {
    if (initialData && notes.length === 0) {
      setNotes(initialData.notes);
      setPagination(initialData.pagination);
    }
  }, [initialData, notes.length, setNotes, setPagination]);

  // Infinite scroll handler
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        status.note.state !== "loading" &&
        status.note.state !== "error" &&
        pagination.hasMore
      ) {
        getPublicNotes({ page: pagination.currentPage + 1, limit: 21 });
      }
    },
    [
      pagination.hasMore,
      pagination.currentPage,
      getPublicNotes,
      status.note.state,
    ],
  );

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    });
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [handleObserver]);

  // Initial load (only if server didn't provide data)
  useEffect(() => {
    if (!initialData && notes.length === 0) {
      getPublicNotes({ page: 1, limit: 21 });
    }
  }, []);

  if (!mounted) {
    return <HomePageStatic notes={initialData?.notes ?? []} />;
  }

  const feed = (
    <div className="flex-1 space-y-3 sm:space-y-4">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>

      {/* Hero */}
      <section>
        <div className="mx-auto py-8 sm:py-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5 max-w-2xl leading-tight">
            The Hub where notes
            <br />
            become knowledge.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Whether you're a student cramming for exams, an engineer documenting
            systems, or a developer exploring new tech — NoteHub is where your
            knowledge finds a home. Help the next person who's searching for
            exactly what you know.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button asChild>
              <Link href="#articles">
                Browse Notes <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section label */}
      <div className="border-x py-8">
        <h2
          id="articles"
          className="screen-line-top screen-line-bottom ml-4 font-heading text-3xl/none font-medium tracking-tight"
        >
          Blog
        </h2>
        <p className="p-4 text-base text-balance text-muted-foreground">
          A collection of articles on development, design, ideas, and tech news.
        </p>
        <div className="screen-line-top relative py-4">
          <div
            className="pointer-events-none absolute inset-0  grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            <div className="border-r border-line" />
            <div className="border-l md:border-x" />
            <div className="border-l max-md:hidden" />
          </div>
          <section
            className="scroll-mt-20 grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            {notes.map((note, index) => (
              <ArticleItem key={note._id || index} note={note} />
            ))}
          </section>
        </div>
      </div>

      {/* Loading skeletons */}
      {status.note.state === "loading" && (
        <section
          className="grid gap-4"
          style={{
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          }}
        >
          {[...Array(9)].map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </section>
      )}

      {/* End of feed */}
      {!pagination.hasMore && notes.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative bg-muted rounded-full p-4 shadow-lg">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">
            You&apos;ve reached the end
          </h3>
          <p className="mt-2 text-center text-muted-foreground max-w-md">
            That&apos;s all for now. Check back later for more content.
          </p>
        </div>
      )}

      {/* Sentinel — always last, never conditional */}
      <div ref={loaderRef} className="h-10 w-full" />
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>
      <div className="flex gap-6 max-w-6xl mx-auto">{feed}</div>
    </div>
  );
};

export default HomePageClient;
