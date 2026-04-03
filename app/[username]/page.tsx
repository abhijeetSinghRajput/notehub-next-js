// app/[username]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import UserPageClient from "./UserPageClient";
import { getDefaultMetadata } from "@/lib/metadata";
import { cache } from "react";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

const getUser = cache(async (username: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/${username}`,
    { next: { revalidate: 3600 } },
  );
  if (!response.ok) return null;
  return response.json();
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  try {
    const user = await getUser(username);

    if (!user) {
      return getDefaultMetadata({
        title: `${username}`,
        description: "This user profile could not be found.",
        noIndex: true, // Private collection
      });
    }

    // Build OG image URL with user data
    const ogImageParams = new URLSearchParams({
      fullName: user.fullName || "User",
      userName: `@${user.userName}`,
      avatar: user.avatar || "https://placehold.co/400x400",
      role: user.role || "user",
    });

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og-user?${ogImageParams.toString()}`;
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${username}`;

    return {
      title: `${user.fullName} (@${user.userName})`,
      description: `View ${user.fullName}'s profile and collections on NoteHub`,
      openGraph: {
        title: `${user.fullName} (@${user.userName})`,
        description: `Check out ${user.fullName}'s collections and notes on NoteHub`,
        url: profileUrl,
        siteName: "NoteHub",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${user.fullName}'s profile`,
          },
        ],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${user.fullName} (@${user.userName})`,
        description: `View ${user.fullName}'s profile on NoteHub`,
        images: [ogImageUrl],
        creator: `@${user.userName}`,
      },
      alternates: {
        canonical: profileUrl,
      },
    };
  } catch (error) {
    console.error("Error generating user metadata:", error);
    return {
      title: "User Profile",
      description: "View user profile and collections on NoteHub",
    };
  }
}

// app/[username]/page.tsx

export default async function UserPage({ params }: Props) {
  const { username } = await params;

  let user;

  try {
    user = await getUser(username);
  } catch (error) {
    console.error("Error loading user page:", error);
    notFound();
  }

  if (!user) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const profileUrl = `${baseUrl}/${username}`;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.fullName,
    url: profileUrl,
    identifier: user.userName,
    image: {
      "@type": "ImageObject",
      url: user.avatar,
      width: 400,
      height: 400,
    },
    ...(user.bio && { description: user.bio }),
    ...(user.socials?.length && {
      sameAs: user.socials.map((s: { url: string }) => s.url),
    }),
  };

  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${user.fullName} (@${user.userName}) — NoteHub Profile`,
    url: profileUrl,
    description: `View ${user.fullName}'s collections and notes on NoteHub.`,
    mainEntity: personSchema,
    isPartOf: {
      "@type": "WebSite",
      name: "NoteHub",
      url: baseUrl,
    },
    breadcrumb: {
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
          name: user.fullName,
          item: profileUrl,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([personSchema, profilePageSchema]),
        }}
      />

      {/* Full interactive profile — auth controls, edit, contributions graph */}
      <UserPageClient initialUser={user} />
    </>
  );
}
