import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read NoteHub's Terms of Service to understand the rules, responsibilities, and guidelines for using our student note-sharing platform.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | NoteHub",
    description:
      "Understand the terms and conditions that govern your use of NoteHub — a student-built platform for sharing notes and resources.",
    url: "/terms",
    type: "article",
    images: [
      {
        url: "/og-terms.jpg",
        width: 1200,
        height: 630,
        alt: "NoteHub Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | NoteHub",
    description:
      "Read the terms and conditions for using NoteHub.",
    images: ["/og-terms.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Service — NoteHub",
    description:
      "Read NoteHub's Terms of Service to understand the rules, responsibilities, and guidelines for using our student note-sharing platform.",
    url: `${baseUrl}/terms`,
    isPartOf: {
      "@type": "WebSite",
      name: "NoteHub",
      url: baseUrl,
    },
    about: {
      "@type": "Organization",
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
          name: "Terms of Service",
          item: `${baseUrl}/terms`,
        },
      ],
    },
    inLanguage: "en",
    dateModified: "2025-06-11",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {children}
    </>
  );
}