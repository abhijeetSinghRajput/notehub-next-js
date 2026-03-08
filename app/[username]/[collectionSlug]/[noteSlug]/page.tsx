// app/[username]/[collectionSlug]/[noteSlug]/page.tsx
import { Metadata } from "next";
import NotePageClient from "./NotePageClient";
import { getDefaultMetadata } from "@/lib/metadata";

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

    const response = await fetch(noteApiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return getDefaultMetadata({
        title: `${noteSlug} by ${username}`,
        description: `View Notes on NoteHub`,
        noIndex: true, // Private note
      });
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
  const { username, collectionSlug, noteSlug } = await params;

  try {
    const noteApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/note/${username}/${collectionSlug}/${noteSlug}`;
    const response = await fetch(noteApiUrl, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return <NotePageClient />;
    }

    const { note, author } = await response.json();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const profileUrl = `${baseUrl}/${username}`;
    const collectionUrl = `${baseUrl}/${username}/${collectionSlug}`;
    const noteUrl = `${baseUrl}/${username}/${collectionSlug}/${noteSlug}`;

    // Strip HTML for description
    const plainText = note.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    // OG image reused as the schema image
    const ogImageParams = new URLSearchParams({
      title: note.name || "Untitled Note",
      collection: note.collectionId?.name || collectionSlug,
      authorName: author.fullName || "Anonymous",
      authorUsername: `@${author.userName || "anonymous"}`,
      authorAvatar: author.avatar || "",
    });
    const ogImageUrl = `${baseUrl}/api/og-note?${ogImageParams.toString()}`;

    const techArticleSchema = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: note.name,
      description: plainText,
      url: noteUrl,
      datePublished: new Date(note.createdAt).toISOString(),
      dateModified: new Date(note.contentUpdatedAt || note.updatedAt).toISOString(),
      image: {
        "@type": "ImageObject",
        url: ogImageUrl,
        width: 1200,
        height: 630,
      },
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
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/icon.png`,
          width: 512,
          height: 512,
        },
      },
      isPartOf: {
        "@type": "CollectionPage",
        name: note.collectionId?.name || collectionSlug,
        url: collectionUrl,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": noteUrl,
      },
      // Signals this is educational/instructional content
      learningResourceType: "Note",
      educationalUse: "Self Study",
      inLanguage: "en",
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: author.fullName,
          item: profileUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: note.collectionId?.name || collectionSlug,
          item: collectionUrl,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: note.name,
          item: noteUrl,
        },
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
        <NotePageClient />
      </>
    );
  } catch (error) {
    console.error("Error loading note page:", error);
    return <NotePageClient />;
  }
}
