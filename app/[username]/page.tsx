// app/[username]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import UserPageClient from "./UserPageClient";
import { IUser } from "@/types/model";
import { getDefaultMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  try {
    const userApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/user/${username}`;

    const response = await fetch(userApiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return getDefaultMetadata({
        title: `${username}`,
        description: "This user profile could not be found.",
        noIndex: true, // Private collection
      });
    }

    const user: IUser = await response.json();

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

export default async function UserPage({ params }: Props) {
  const { username } = await params;

  try {
    // Fetch user data on the server for initial validation
    const userApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/user/${username}`;
    const response = await fetch(userApiUrl);

    if (!response.ok) {
      notFound();
    }

    const user: IUser = await response.json();

    // Pass initial data to client component
    return <UserPageClient initialUser={user} />;
  } catch (error) {
    console.error("Error loading user page:", error);
    notFound();
  }
}