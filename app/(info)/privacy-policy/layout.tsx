import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read NoteHub’s Privacy Policy to understand how we collect, use, and protect your personal information and notes.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | NoteHub",
    description:
      "Learn how NoteHub collects, stores, and protects your personal data and notes.",
    url: "/privacy-policy",
    type: "article",
    images: [
      {
        url: "/og-privacy-policy.jpg",
        width: 1200,
        height: 630,
        alt: "NoteHub Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | NoteHub",
    description:
      "Understand how your data is handled and secured on NoteHub.",
    images: ["/og-privacy-policy.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyLayout({ children }: { children: ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy — NoteHub",
    description:
      "Read NoteHub's Privacy Policy to understand how we collect, use, and protect your personal information and notes.",
    url: `${baseUrl}/privacy-policy`,
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
          name: "Privacy Policy",
          item: `${baseUrl}/privacy-policy`,
        },
      ],
    },
    inLanguage: "en",
    dateModified: "2025-07-20",
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