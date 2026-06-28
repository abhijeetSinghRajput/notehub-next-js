/* app/[username]/[collectionSlug]/[noteSlug]/page.tsx
 * Fix #5 — LCP delay + Fix #7 — Forced reflow
 *
 * Key change: extract <img> src/alt pairs on the server while we already
 * have the processed HTML string in memory. Passing `initialImages` to
 * NotePageClient means `useNoteContentProcessing` is skipped entirely on
 * the client, eliminating one full DOM parse + forced reflow after hydration.
 */
import { Metadata } from "next";
import NotePageClient from "./NotePageClient";
import { getDefaultMetadata } from "@/lib/metadata";
import { processNoteContent } from "@/lib/note/processNoteContent";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>;
};

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Extract image list from processed HTML string without a full DOM parse.
 * Uses a regex instead of JSDOM to keep it allocation-free on the server.
 */
function extractImages(html: string): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  // Match <img ... src="..." ... alt="..." ...>
  const imgRe = /<img\b([^>]*)>/gi;
  const attrRe = /\b(src|alt)=["']([^"']*)["']/gi;
  let imgMatch: RegExpExecArray | null;

  while ((imgMatch = imgRe.exec(html)) !== null) {
    const attrs = imgMatch[1];
    let src = "";
    let alt = "";
    let attrMatch: RegExpExecArray | null;
    attrRe.lastIndex = 0;
    while ((attrMatch = attrRe.exec(attrs)) !== null) {
      if (attrMatch[1].toLowerCase() === "src") src = attrMatch[2];
      if (attrMatch[1].toLowerCase() === "alt") alt = attrMatch[2];
    }
    if (src) images.push({ src, alt });
  }

  return images;
}

// ─── metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, collectionSlug, noteSlug } = await params;

  try {
    const noteApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/note/${username}/${collectionSlug}/${noteSlug}`;
    const response = await fetch(noteApiUrl, { cache: "no-store" });

    if (!response.ok) {
      return getDefaultMetadata({
        title: `${noteSlug} by ${username}`,
        description: `View Notes on NoteHub`,
        noIndex: true,
      });
    }

    const { note, author } = await response.json();

    const plainText = note.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const ogImageParams = new URLSearchParams({
      title: note.name || "Untitled Note",
      collection: note.collection?.name || collectionSlug || "General",
      authorName: author.fullName || "Anonymous",
      authorUsername: `@${author.userName || "anonymous"}`,
      authorAvatar: author.avatar || "https://placehold.net/avatar.png",
    });

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og-note?${ogImageParams.toString()}`;
    const noteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${note.slug || noteSlug}`;

    const seoTitle = note.seo?.title || note.name || "Untitled Note";
    const seoDescription = note.seo?.description || plainText || "Read this note on NoteHub";
    const seoKeywords = Array.isArray(note.seo?.keywords) && note.seo.keywords.length > 0
      ? note.seo.keywords            // pass array directly — Next.js Metadata accepts string[]
      : [];
    const seoImage = note.seo?.image?.url || ogImageUrl;
    const seoImageAlt = note.seo?.image?.alt || seoTitle;

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: noteUrl,
        siteName: "NoteHub",
        images: [{ url: seoImage, width: 1200, height: 630, alt: seoImageAlt }],
        type: "article",
        publishedTime: note.createdAt,
        modifiedTime: note.contentUpdatedAt,
        authors: [author.fullName],
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description: seoDescription,
        images: [seoImage],
        creator: `@${author.userName}`,
      },
      alternates: { canonical: noteUrl },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Note", description: "View this note on NoteHub" };
  }
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function NotePage({ params }: Props) {
  const { username, collectionSlug, noteSlug } = await params;

  try {
    const noteApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/note/${username}/${collectionSlug}/${noteSlug}`;
    const response = await fetch(noteApiUrl, { cache: "no-store" });

    if (!response.ok) {
      return <NotePageClient initialNote={null} initialAuthor={null} />;
    }

    const { note, author } = await response.json();

    // Process content server-side (hljs, KaTeX, injected buttons)
    note.content = await processNoteContent(note.content);

    // Fix #7 — Extract images on the server while we already have the HTML,
    // so the client skips its own DOM parse entirely.
    const initialImages = extractImages(note.content);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const profileUrl = `${baseUrl}/${username}`;
    const collectionUrl = `${baseUrl}/${username}/${collectionSlug}`;
    const noteUrl = `${baseUrl}/${username}/${collectionSlug}/${note.slug || noteSlug}`;

    const plainText = note.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    const ogImageParams = new URLSearchParams({
      title: note.name || "Untitled Note",
      collection: note.collectionId?.name || collectionSlug,
      authorName: author.fullName || "Anonymous",
      authorUsername: `@${author.userName || "anonymous"}`,
      authorAvatar: author.avatar || "",
    });
    const ogImageUrl = `${baseUrl}/api/og-note?${ogImageParams.toString()}`;

    const seoTitle = note.seo?.title || note.name || "Untitled Note";
    const seoDescription = note.seo?.description || plainText || "Read this note on NoteHub";
    const seoImage = note.seo?.image?.url || ogImageUrl;

    const techArticleSchema = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: seoTitle,
      description: seoDescription,
      url: noteUrl,
      datePublished: new Date(note.createdAt).toISOString(),
      dateModified: new Date(note.contentUpdatedAt || note.updatedAt).toISOString(),
      image: { "@type": "ImageObject", url: seoImage, width: 1200, height: 630 },
      author: {
        "@type": "Person",
        name: author.fullName,
        url: profileUrl,
        image: author.avatar,
        identifier: author.userName,
      },
      publisher: {
        "@type": "Organization",
        name: "NoteHub",
        url: baseUrl,
        logo: { "@type": "ImageObject", url: `${baseUrl}/icon.png`, width: 512, height: 512 },
      },
      isPartOf: {
        "@type": "CollectionPage",
        name: note.collectionId?.name || collectionSlug,
        url: collectionUrl,
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": noteUrl },
      learningResourceType: "Note",
      educationalUse: "Self Study",
      inLanguage: "en",
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: author.fullName, item: profileUrl },
        { "@type": "ListItem", position: 3, name: note.collectionId?.name || collectionSlug, item: collectionUrl },
        { "@type": "ListItem", position: 4, name: note.name, item: noteUrl },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([techArticleSchema, breadcrumbSchema]),
          }}
        />
        {/* Fix #7 — pass server-extracted images to skip client DOM parse */}
        <NotePageClient
          initialNote={note}
          initialAuthor={author}
          initialImages={initialImages}
        />
      </>
    );
  } catch (error) {
    console.error("Error loading note page:", error);
    return <NotePageClient initialNote={null} initialAuthor={null} />;
  }
}