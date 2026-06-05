// app/(home)/HomePageStatic.tsx
// NO "use client" — pure server HTML for crawlers and no-JS users
import Link from "next/link";
import { ArrowRight, Bookmark, ChevronRight } from "lucide-react";
import OnboardingCard from "@/components/OnboardingCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function HomePageStatic({ notes }: { notes: any[] }) {
  if (!notes?.length) return null;

  return (
    <div id="static-feed" className="p-2">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>

      {/* Hero + Sidebar row */}
      <div className="flex gap-6 max-w-6xl mx-auto">
        <div className="flex-1 max-w-5xl">
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
                is where your knowledge finds a home. help the next person who's
                searching for exactly what you know.
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

          {/* Articles */}
          <div id="articles" className="scroll-mt-20 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-6 pb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="size-4" />
                <Label htmlFor="articles">Articles</Label>
              </div>
              <span className="border-b flex-1"></span>
            </div>

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

              return (
                <div
                  key={note._id}
                  className="w-full rounded-xl bg-card sm:rounded-2xl border-t border-border lg:border p-4 lg:p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={author?.avatar || "/avatar.svg"}
                      alt={author?.fullName || "Author"}
                      className="size-8 rounded-full object-cover"
                    />
                    <div className="text-sm">
                      <Link
                        href={`/${author?.userName}`}
                        className="font-medium hover:underline"
                      >
                        {author?.fullName}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        · @{author?.userName}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-base sm:text-xl font-semibold mb-2">
                    <Link
                      href={collectionHref}
                      className="text-muted-foreground hover:underline"
                    >
                      {collection?.name}
                    </Link>
                    {" / "}
                    <Link href={noteHref} className="hover:underline">
                      {displayTitle}
                    </Link>
                  </h2>

                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {displayDescription}
                  </p>

                  <Link
                    href={noteHref}
                    className="mt-2 inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20"
                    aria-label={`Read more about ${displayTitle}`}
                  >
                    Read More <ChevronRight className="size-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col gap-4 w-full max-w-sm shrink-0 sticky top-18 self-start">
          <OnboardingCard />
        </aside>
      </div>
    </div>
  );
}
