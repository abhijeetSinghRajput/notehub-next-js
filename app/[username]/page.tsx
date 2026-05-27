// app/[username]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import UserPageClient from "./UserPageClient";
import { getDefaultMetadata } from "@/lib/metadata";
import { cache } from "react";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

const getUser = cache(async (username: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/${username}`,
    { cache: "no-store" }
  );
  if (!response.ok) return null;
  return response.json();
});

const getGitHubContributions = cache(async (username: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/github/contributions/${username}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      console.error(`GitHub fetch failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching GitHub contributions:", err);
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  try {
    const user = await getUser(username);

    if (!user) {
      return getDefaultMetadata({
        title: `${username}`,
        description: "This user profile could not be found.",
        noIndex: true,
      });
    }

    // Use bio if available, otherwise a meaningful fallback
    const description = user.bio?.trim()
      ? `${user.bio} — View ${user.fullName}'s notes and collections on NoteHub`
      : `View ${user.fullName}'s notes and collections on NoteHub. Discover curated knowledge, shared openly.`;

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
      description,
      robots: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
      openGraph: {
        title: `${user.fullName} (@${user.userName})`,
        description,
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
        description,
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

export default async function UserPage({ params }: Props) {
  const { username } = await params;

  let user;
  let githubData;
  try {
    [user, githubData] = await Promise.all([
      getUser(username),
      getGitHubContributions(username),
    ]);
    console.log("User Page SSR:", {
      username,
      hasGithubInUser: !!user?.github,
      hasGithubData: !!githubData,
    });
  } catch (error) {
    console.error("Error loading user page:", error);
    notFound();
  }

  if (!user) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const profileUrl = `${baseUrl}/${username}`;

  // Same description logic as generateMetadata — keep in sync
  const description = user.bio?.trim()
    ? `${user.bio} — View ${user.fullName}'s notes and collections on NoteHub`
    : `View ${user.fullName}'s notes and collections on NoteHub. Discover curated knowledge, shared openly.`;

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
    description, // ← now dynamic, matches meta description
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
      <UserPageClient initialUser={user} githubData={githubData} />
      <Footer className="py-20" />
    </>
  );
}