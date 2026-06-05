"use client";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { noteToArticle } from "@/lib/utils";
import { ArticleCardSkeleton } from "@/components/ArticleCardSkeleton";
import { ArrowRight, Bookmark, CheckCircle2 } from "lucide-react";
import { PopulatedNote } from "@/types/model";
import OnboardingCard from "@/components/OnboardingCard";
import WritingTipsCard from "@/components/WritingTipsCard";
import { ArticleCard } from "@/components/article-card";
import HomePageStatic from "./HomePageStatic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";

type Props = {
  initialData?: any;
};

const HomePageClient = ({ initialData }: Props) => {
  const loaderRef = useRef(null);
  const { notes, pagination, getPublicNotes, status, setNotes, setPagination } =
    useNoteStore();
  const { authUser } = useAuthStore();
  const isGuest = !authUser;

  // After hydration, swap static → interactive
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const articles = useMemo(
    () => notes.map((note) => noteToArticle(note as PopulatedNote)),
    [notes],
  );

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
        pagination.hasMore
      ) {
        getPublicNotes({ page: pagination.currentPage + 1, limit: 10 });
      }
    },
    [pagination, getPublicNotes, status],
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

  // Initial load (only if server didn't provide data)
  useEffect(() => {
    if (!initialData && notes.length === 0) {
      getPublicNotes({ page: 1, limit: 10 });
    }
  }, []);

  // ── Before hydration — show static layer (SSR'd, visible to crawlers) ──
  if (!mounted) {
    return <HomePageStatic notes={initialData?.notes ?? []} />;
  }

  // ── After hydration — full interactive feed ──────────────────────────────

  const feed = (
    <div className="flex-1 space-y-3 sm:space-y-4 max-w-5xl">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>
      <section>
        <div className="max-w-5xl mx-auto py-8 sm:py-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5 max-w-2xl leading-tight">
            The Hub where notes
            <br />
            become knowledge.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Whether you're a student cramming for exams, an engineer documenting
            systems, or a developer exploring new tech — NoteHub is where your
            knowledge finds a home. help the next person who's searching for
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

      <div id="articles" className="scroll-mt-20 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-6 pb-4">
          {/* <span className="border-b flex-1"></span> */}
          <div className="flex items-center gap-2">
            <Bookmark className="size-4" />
            <Label htmlFor="articles">Articles</Label>
          </div>
          <span className="border-b flex-1"></span>
        </div>

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
      </div>

      {status.note.state === "loading" &&
        [...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} />)}

      <div ref={loaderRef} className="h-1" />

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
    </div>
  );

  const sidebarCard = isGuest ? <OnboardingCard /> : <WritingTipsCard />;
  const mobileCard = isGuest ? (
    <OnboardingCard />
  ) : (
    <WritingTipsCard defaultOpen={false} />
  );

  return (
    <div className="p-4">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>

      <div className="flex flex-col gap-4 mb-6 w-full lg:hidden">
        {mobileCard}
      </div>

      <div className="flex gap-6 max-w-6xl mx-auto">
        {feed}
        <aside className="hidden lg:flex flex-col gap-4 w-full max-w-sm shrink-0 sticky top-18 self-start">
          {sidebarCard}
        </aside>
      </div>
    </div>
  );
};

export default HomePageClient;
