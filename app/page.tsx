import { PopulatedNote } from "@/types/model";
import HomePageClient from "./HomePageClient";
import { Metadata } from "next";
import { cache } from "react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");

const getInitialNotes = cache(async () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  try {
    const res = await fetch(`${apiBaseUrl}/note?server=true&page=1&limit=10`, {
      next: { revalidate: 60 }, // cache for 60s instead of no-store
    });
    const json = await res.json();
    return json?.data ?? null;
  } catch (e) {
    console.error("Failed to fetch notes", e);
    return null;
  }
});

// Generate dynamic metadata
export async function generateMetadata(): Promise<Metadata> {
  const data = await getInitialNotes();
  const notes = data?.notes ?? [];

  // Get unique topics/categories from notes
  const topics = [...new Set(notes.map((note: PopulatedNote) => note.collectionId?.name))];
  const authors = [...new Set(notes.map((note: PopulatedNote) => note.userId?.fullName))];

  // Create a dynamic description based on the notes
  const topNotes = notes.slice(0, 3).map((note: PopulatedNote) => note.name).join(', ');
  const description = `Discover ${data?.pagination?.totalNotes || 'hundreds of'} public notes on ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? ' and more' : ''}. Featured notes: ${topNotes}${notes.length > 3 ? '...' : ''}`;

  return {
    title: {
      absolute: "NoteHub — Explore Public Notes & Knowledge Sharing",
      template: "%s | NoteHub"
    },
    description: description,
    keywords: [
      'public notes',
      'knowledge sharing',
      'study notes',
      'developer notes',
      'student notes',
      'collaborative learning',
      ...topics,
      ...authors
    ] as string[],
    authors: authors.filter((name): name is string => typeof name === 'string').map((name) => ({ name })),
    openGraph: {
      title: 'NoteHub — Explore Public Notes',
      description: description,
      url: baseUrl || "http://localhost:3000",
      siteName: 'NoteHub',
      images: [
        {
          url: `${baseUrl || "http://localhost:3000"}/og-image.png`, // Make sure you have this image
          width: 1200,
          height: 630,
          alt: 'NoteHub - Public Notes Platform',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NoteHub — Explore Public Notes',
      description: description,
      images: [`${baseUrl}/og-image.png`],
      creator: '@notehub', // Update with your Twitter handle
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: baseUrl,
    },
    category: 'education',
  };
}

export default async function HomePage() {
  const data = await getInitialNotes();
  const notes = data?.notes ?? [];

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "NoteHub — Explore Public Notes",
    description: data?.notes ?
      `Discover ${data.pagination.totalNotes} public notes shared by ${data.notes.length} authors` :
      "Discover and explore public notes shared by developers and students on NoteHub.",
    url: baseUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "NoteHub",
      url: baseUrl,
    },
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Public Notes Feed",
    description: "Latest public notes from the NoteHub community",
    numberOfItems: notes.length,
    itemListElement: notes.map((note: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TechArticle",
        name: note.name,
        url: `${baseUrl}/${note.userId.userName}/${note.collectionId.slug}/${note.slug}`,
        author: {
          "@type": "Person",
          name: note.userId.fullName,
        },
        datePublished: note.createdAt,
        dateModified: note.contentUpdatedAt || note.updatedAt,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webPageSchema, itemListSchema]),
        }}
      />

      {/* Add meta tags for crawlers */}
      <meta name="total-notes" content={data?.pagination?.totalNotes?.toString()} />
      <meta name="authors-count" content={[...new Set(notes.map((n: PopulatedNote) => n.userId.userName))].length.toString()} />
        
      <HomePageClient initialData={data} />
    </>
  );
}