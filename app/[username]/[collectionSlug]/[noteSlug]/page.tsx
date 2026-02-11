// app/[username]/[collectionSlug]/[noteSlug]/page.tsx
import { Metadata } from "next";
import NotePageClient from "./NotePageClient";

// ✅ FIX: Add proper TypeScript types and await params
type Props = {
  params: Promise<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ✅ CRITICAL: Await params in Next.js 15+
  const { username, collectionSlug, noteSlug } = await params;

  try {
    const noteApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/note/${username}/${collectionSlug}/${noteSlug}`;

    console.log("Fetching metadata from:", noteApiUrl);

    const response = await fetch(noteApiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error("Metadata fetch failed:", response.status);
      return {
        title: "Note Not Found",
        description: "This note could not be found.",
      };
    }

    const { note, author } = await response.json();

    // Extract plain text from HTML
    const plainText = note.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    // ✅ BUILD OG IMAGE URL WITH QUERY PARAMS
    const ogImageParams = new URLSearchParams({
      title: note.name || "Untitled Note",
      collection: note.collection?.name || collectionSlug || "General",
      authorName: author.fullName || "Anonymous",
      authorUsername: `@${author.userName || "anonymous"}`,
      authorAvatar: author.avatar || "https://placehold.net/avatar.png",
    });

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og-note?${ogImageParams.toString()}`;
    const noteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${noteSlug}`;

    return {
      title: note.name || "Untitled Note",
      description: plainText || "Read this note on NoteHub",
      openGraph: {
        title: note.name,
        description: plainText,
        url: noteUrl,
        siteName: "NoteHub",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: note.name,
          },
        ],
        type: "article",
        publishedTime: note.createdAt,
        modifiedTime: note.contentUpdatedAt,
        authors: [author.fullName],
      },
      twitter: {
        card: "summary_large_image",
        title: note.name,
        description: plainText,
        images: [ogImageUrl],
        creator: `@${author.userName}`,
      },
      alternates: {
        canonical: noteUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Note",
      description: "View this note on NoteHub",
    };
  }
}

// ✅ Also await params in the page component
export default async function NotePage({ params }: Props) {
  // If you need to pass params to client component:
  const resolvedParams = await params;

  return <NotePageClient />;
}
