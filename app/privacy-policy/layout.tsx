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

export default function PrivacyPolicyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}