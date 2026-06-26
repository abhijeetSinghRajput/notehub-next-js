// app/(home)/HomePageStatic.tsx
// NO "use client" — pure server HTML for crawlers and no-JS users
import Link from "next/link";
import { ArrowRight, Bookmark, Clock, ArrowRight as ReadArrow } from "lucide-react";
import OnboardingCard from "@/components/OnboardingCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function buildOgImageUrl(note: any) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const author = note.userId;
  const collection = note.collectionId;
  const params = new URLSearchParams({
    title: note.name || "Note",
    authorName: author?.fullName || "User",
    authorUsername: `@${author?.userName ?? "notehub"}`,
    authorAvatar: author?.avatar || "",
    collection: collection?.name || "",
  });
  return `${base}/api/og-note?${params.toString()}`;
}

export default function HomePageStatic({ notes }: { notes: any[] }) {
  if (!notes?.length) return null;

  return (
    <div id="static-feed" className="p-4">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>

      <div className="flex gap-6 max-w-6xl mx-auto">
        <div className="flex-1 space-y-3 sm:space-y-4">

          {/* Hero */}
          <section>
            <div className="py-8 sm:py-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5 max-w-2xl leading-tight">
                The Hub where notes
                <br />
                become knowledge.
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Whether you're a student cramming for exams, an engineer
                documenting systems, or a developer exploring new tech — NoteHub
                is where your knowledge finds a home. Help the next person
                who's searching for exactly what you know.
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
          <div className="flex items-center gap-6 pb-4">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4" />
              <Label htmlFor="articles">Articles</Label>
            </div>
            <span className="border-b flex-1" />
          </div>

          {/* Articles grid */}
          <section
            id="articles"
            className="scroll-mt-20 grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            {notes.map((note: any) => {
              const author = note.userId;
              const collection = note.collectionId;
              const noteHref = `/${author?.userName}/${collection?.slug}/${note.slug}`;
              const collectionHref = `/${author?.userName}/${collection?.slug}`;
              const displayTitle = note.seo?.title || note.name;
              const displayDescription =
                note.seo?.description ||
                note.content
                  ?.replace(/<[^>]*>/g, "")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 200);
              const displayImage =
                note.seo?.image?.url || buildOgImageUrl(note);
              const displayImageAlt = note.seo?.image?.alt || displayTitle;

              return (
                <Card
                  key={note._id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border-border/60 bg-card/80 p-0 shadow-sm backdrop-blur-sm transition duration-300 hover:border-primary/20 hover:bg-accent/50 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={displayImage}
                      alt={displayImageAlt}
                      className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60" />

                    {/* collection badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="secondary"
                        className="rounded-full border-border/40 bg-black/30 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-md hover:bg-black/40"
                        asChild
                      >
                        <Link href={collectionHref}>{collection?.name}</Link>
                      </Badge>
                    </div>
                  </div>

                  {/* Body */}
                  <CardContent className="flex flex-1 flex-col px-5 pt-4 pb-5">

                    {/* Author row */}
                    <div className="mb-3 flex items-center gap-2">
                      <img
                        src={author?.avatar || "/avatar.svg"}
                        alt={author?.fullName || "Author"}
                        className="size-6 rounded-full object-cover ring-1 ring-border"
                      />
                      <div className="text-xs text-muted-foreground">
                        <Link
                          href={`/${author?.userName}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {author?.fullName}
                        </Link>
                        <span> · @{author?.userName}</span>
                      </div>
                    </div>

                    {/* Title + description */}
                    <Link href={noteHref}>
                      <h2 className="mb-2 text-base font-semibold leading-snug tracking-tight text-foreground transition duration-300 group-hover:text-primary sm:text-lg">
                        {displayTitle}
                      </h2>
                      <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {displayDescription}
                      </p>
                    </Link>

                    {/* Footer row */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50">
                        <Clock className="size-3" aria-hidden="true" />
                        {note.contentUpdatedAt
                          ? new Date(note.contentUpdatedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )
                          : "Recently"}
                      </span>

                      <Link
                        href={noteHref}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/50 transition duration-300 group-hover:text-primary"
                        aria-label={`Read more about ${displayTitle}`}
                      >
                        Read
                        <ReadArrow className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}