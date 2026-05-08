// app/[username]/[collectionSlug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPageClient from "./CollectionPageClient";
import { cache } from "react";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    username: string;
    collectionSlug: string;
  }>;
};

const getCollection = cache(
  async (username: string, collectionSlug: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/collection/${username}/${collectionSlug}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    return response.json();
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, collectionSlug } = await params;

  try {
    const data = await getCollection(username, collectionSlug);

    if (!data) notFound();

    const { collection, author } = data!;

    // Extract first few notes for keywords
    const noteNames =
      collection.notes?.slice(0, 5).map((note: any) => note.name) || [];
    const keywords = [
      collection.name,
      ...noteNames,
      `${author.fullName}'s collection`,
      "study notes",
      "educational content",
      "learning resources",
    ].join(", ");

    // Get first note preview for description
    const firstNotes = collection.notes
      ?.slice(0, 3)
      .map((note: any) => note.name)
      .join(", ");
    const description = `Explore ${collection.name} collection by ${author.fullName}. Contains ${collection.noteCount} notes on ${firstNotes || "various topics"}. Perfect for learning and revision.`;

    // Build OG image URL with enhanced data
    const ogImageParams = new URLSearchParams({
      title: collection.name || "Collection",
      totalNotes: collection.noteCount?.toString() || "0",
      authorName: author.fullName || "User",
      authorUsername: `@${author.userName}`,
      authorAvatar: author.avatar || "",
      collectionId: collection._id, // Optional: for tracking
    });

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og-collection?${ogImageParams.toString()}`;
    const collectionUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}`; // Note: removed /collection/ if your route doesn't need it

    // Format dates for structured data
    const createdDate = new Date(collection.createdAt).toISOString();
    const updatedDate = new Date(collection.updatedAt).toISOString();

    return {
      // Basic metadata
      title: `${collection.name} by ${author.fullName}`,
      description: description,
      keywords: keywords,

      // Open Graph
      openGraph: {
        title: collection.name,
        description: description,
        url: collectionUrl,
        siteName: "NoteHub",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${collection.name} collection cover image`,
          },
        ],
        type: "website",
      },

      // Twitter Card
      twitter: {
        card: "summary_large_image",
        title: collection.name,
        description: description,
        images: [ogImageUrl],
        creator: `@${author.userName}`,
        site: "@NoteHub", // Add your site's Twitter handle
      },

      // Canonical URL
      alternates: {
        canonical: collectionUrl,
      },

      // Additional useful meta tags
      other: {
        "og:locale": "en_US",
        "og:site_name": "NoteHub",
        "article:author": author.fullName,
        "article:published_time": createdDate,
        "article:modified_time": updatedDate,
        "article:section": "Education",
        "article:tag": keywords,
        "profile:username": author.userName,
        "profile:full_name": author.fullName,
      },
    };
  } catch (error) {
    console.error("Error generating collection metadata:", error);
    return {
      title: "Collection",
      description: "View collection on NoteHub",
    };
  }
}

// app/[username]/[collectionSlug]/page.tsx

export default async function CollectionPage({ params }: Props) {
  const { username, collectionSlug } = await params;

  try {
    const data = await getCollection(username, collectionSlug);

    if (!data) notFound();

    const { collection, author } = data!;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const profileUrl = `${baseUrl}/${username}`;
    const collectionUrl = `${baseUrl}/${username}/${collectionSlug}`;

    const collectionPageSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: collection.name,
      description: `A collection of ${collection.noteCount ?? 0} notes by ${author.fullName} on NoteHub.`,
      url: collectionUrl,
      dateCreated: new Date(collection.createdAt).toISOString(),
      dateModified: new Date(collection.updatedAt).toISOString(),
      author: {
        "@type": "Person",
        name: author.fullName,
        url: profileUrl,
        image: author.avatar,
        identifier: author.userName,
      },
      isPartOf: {
        "@type": "WebSite",
        name: "NoteHub",
        url: baseUrl,
      },
    };

    // Build ItemList from notes in the collection
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Notes in ${collection.name}`,
      numberOfItems: collection.notes?.length ?? 0,
      itemListElement: (collection.notes ?? []).map(
        (note: any, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          name: note.name,
          url: `${collectionUrl}/${note.slug}`,
        }),
      ),
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
          name: collection.name,
          item: collectionUrl,
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              collectionPageSchema,
              itemListSchema,
              breadcrumbSchema,
            ]),
          }}
        />
        <CollectionPageClient initialData={data} />
        <Footer className="py-20" />
      </>
    );
  } catch (error) {
    console.error("Error loading collection page:", error);
    return (
      <>
        <CollectionPageClient />;
        <Footer className="py-20" />
      </>
    )
  }
}
