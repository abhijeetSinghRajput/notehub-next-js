// app/(home)/HomePageStatic.tsx
// NO "use client" — pure server HTML for crawlers and no-JS users
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Clock,
  ArrowRight as ReadArrow,
} from "lucide-react";
import OnboardingCard from "@/components/OnboardingCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ArticleItem } from "@/components/article-item";
import VSCodeInstallDemo from "@/components/VSCodeInstallDemo";
import VSCodeInstallDemoStatic from "@/components/VSCodeInstallDemoStatic";

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
    <div id="static-feed" className="p-4 pt-0">
      <h1 className="sr-only">NoteHub — Explore Public Notes</h1>

      <div className="border-x py-8 max-w-6xl mx-auto">
        <section className="screen-line-bottom">
          <div className="relative py-8 sm:py-16 flex flex-col-reverse sm:flex-row items-center gap-8 sm:gap-12">
            {/* Hero image — full width on mobile, absolute on sm+ */}
            <div className="w-full sm:absolute sm:right-0 sm:top-0 sm:bottom-0 flex sm:justify-end sm:items-center">
              <Image
                src="/hero.svg"
                alt="NoteHub hero illustration"
                width={520}
                height={420}
                priority
                className="w-full sm:w-auto sm:max-w-sm lg:max-w-md xl:max-w-lg object-contain
                   opacity-75 dark:invert dark:brightness-90"
              />
            </div>

            {/* Text content */}
            <div className="mx-4 relative text-center sm:text-left z-10 flex-1 min-w-0">
              {/* Gradient backdrop — only on sm+ when image overlaps */}
              <div
                className="hidden sm:block absolute inset-0 left-0 -top-4 -bottom-4
                      bg-linear-to-r from-background via-background/80 to-transparent
                      pointer-events-none"
              />

              <div className="relative">
                <h2 className="text-4xl text-[28px] sm:text-5xl font-bold tracking-tight text-foreground mb-5 max-w-2xl leading-tight">
                  Share What You Know.
                  <br />
                  Explore What You Don't.
                </h2>
                <p className="sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  A student community built on sharing knowledge freely — where
                  every note you upload helps someone else move forward.
                </p>
                <div className="flex flex-wrap gap-3 mt-8 justify-center sm:justify-start">
                  <Button asChild>
                    <Link href="/login">
                      Login
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">Contact us</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VSCode Extension Section */}
        <section className="screen-line-bottom">
          <div className="relative py-8 md:py-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* VSCode Demo - Left side, absolute positioning */}
            <div className="w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex lg:justify-start lg:items-center">
              <div className="mx-auto lg:mx-0 w-full md:max-w-xl lg:max-w-lg xl:max-w-xl">
                <VSCodeInstallDemoStatic />
              </div>
            </div>

            {/* Text content - Right side */}
            <div className="relative mx-4 text-center lg:text-left z-10 flex-1 min-w-0 lg:ml-auto max-w-max">
              {/* Gradient backdrop - only on md+ when image overlaps */}
              <div
                className="hidden lg:block absolute inset-0 right-0 -top-4 -bottom-4
                      bg-linear-to-l from-background via-background/90 to-transparent
                      pointer-events-none"
              />

              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-5 max-w-2xl leading-tight">
                  Take Notes Where You Code.
                </h2>

                <p className="lg:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Access your NoteHub collections and notes directly in{" "}
                  <Badge
                    variant="secondary"
                    className="rounded-sm gap-1.5 px-2 py-1"
                  >
                    <Image
                      src="/vs-code.svg"
                      height={16}
                      width={16}
                      alt="VS Code"
                      className="w-4 h-4"
                    />
                    VS Code
                  </Badge>
                  .
                  <br />
                  <span className="hidden lg:inline">
                    Browse, search, and manage your knowledge without leaving
                    your editor.
                  </span>
                </p>

                <div className="flex flex-wrap gap-3 mt-8 justify-center lg:justify-start">
                  <Button
                    asChild
                    className="gap-2 bg-[#007acc] text-white hover:bg-[#007acc]/90"
                  >
                    <a
                      // href="https://marketplace.visualstudio.com/items?itemName=mrcodium.notehub-vscode"
                      href="vscode:extension/mrcodium.notehub-vscode"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                        fill="currentColor"
                      >
                        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.494 1.494 0 0 0 1.705.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.94a1.5 1.5 0 0 0-.85-1.353zm-5.94 13.834L9.7 12.001l7.51-4.42v8.84z" />
                      </svg>
                      Install Extension
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="border-dashed">
                    <a
                      target="_blank"
                      href="https://marketplace.visualstudio.com/search?term=mrcodium&target=VSCode&category=All%20categories&sortBy=Relevance"
                    >
                      View All Extensions
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="stripe-divider h-12"></div>

        <h2
          id="articles"
          className="screen-line-top screen-line-bottom ml-4 font-heading text-3xl/none font-medium tracking-tight"
        >
          Blog
        </h2>
        <p className="p-4 text-base text-balance text-muted-foreground">
          A collection of articles on development, design, ideas, and tech news.
        </p>
        <div className="screen-line-top relative py-6">
          <div
            className="pointer-events-none absolute inset-0  grid gap-6 sm:gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            <div className="border-r" />
            <div className="border-l md:border-x" />
            <div className="border-l max-md:hidden" />
            <div className="border-l max-lg:hidden" />
          </div>
          <section
            className="scroll-mt-20 grid gap-6 sm:gap-4"
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
    </div>
  );
}
