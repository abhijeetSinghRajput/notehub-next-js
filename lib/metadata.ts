// lib/metadata.ts
import { Metadata } from "next";

export function getDefaultMetadata(options?: {
  title?: string;
  description?: string;
  noIndex?: boolean;
}): Metadata {
  const title = options?.title || "NoteHub";
  const description = options?.description || 
    "NoteHub — a collaborative platform for capturing, organizing, and sharing notes effortlessly. Built for students and developers.";

  return {
    title,
    description,
    ...(options?.noIndex && { robots: 'noindex, nofollow' }),
    openGraph: {
      type: "website",
      title: "NoteHub | Smart Note-Taking for Developers & Students",
      description:
        "Write, structure, and share notes beautifully with NoteHub. Ideal for students, programmers, and teams collaborating on ideas and knowledge.",
      images: [
        {
          url: "/og-notehub-light.png",
          width: 1200,
          height: 630,
          alt: "NoteHub",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "NoteHub | Smart Note-Taking for Developers & Students",
      description:
        "A collaborative note-taking app with markdown, LaTeX, and contribution tracking — built for productivity and clarity.",
      images: ["/og-notehub-light.png"],
    },
  };
}