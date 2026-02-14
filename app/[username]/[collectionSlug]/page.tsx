// app/[username]/[collectionSlug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPageClient from "./CollectionPageClient";

type Props = {
  params: Promise<{
    username: string;
    collectionSlug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, collectionSlug } = await params;

  try {
    const collectionApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/collection/${username}/${collectionSlug}`;

    const response = await fetch(collectionApiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return {
        title: "Collection Not Found",
        description: "This collection could not be found.",
      };
    }

    const data = await response.json();
    const { collection, author } = data;
    
    // Extract first few notes for keywords
    const noteNames = collection.notes?.slice(0, 5).map((note: any) => note.name) || [];
    const keywords = [
      collection.name,
      ...noteNames,
      `${author.fullName}'s collection`,
      "study notes",
      "educational content",
      "learning resources"
    ].join(", ");

    // Get first note preview for description
    const firstNotes = collection.notes?.slice(0, 3).map((note: any) => note.name).join(", ");
    const description = `Explore ${collection.name} collection by ${author.fullName}. Contains ${collection.noteCount} notes on ${firstNotes || 'various topics'}. Perfect for learning and revision.`;

    // Build OG image URL with enhanced data
    const ogImageParams = new URLSearchParams({
      title: collection.name || "Collection",
      totalNotes: collection.noteCount?.toString() || "0",
      authorName: author.fullName || "User",
      authorUsername: `@${author.userName}`,
      authorAvatar: author.avatar || '',
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

export default async function CollectionPage({ params }: Props) {
  const { username, collectionSlug } = await params;

  try {
    // SINGLE API CALL - Fetch collection data on server
    const collectionApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/collection/${username}/${collectionSlug}`;
    const response = await fetch(collectionApiUrl, {
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      // Pass error status to client component
      return <CollectionPageClient error={response.status} />;
    }

    const data = await response.json();
    
    // Pass all data to client component
    return <CollectionPageClient initialData={data} />;
  } catch (error) {
    console.error("Error loading collection page:", error);
    return <CollectionPageClient error={500} />;
  }
}