import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Reset your NoteHub password securely and recover account access so you can continue managing your notes and collections without interruption.",
  alternates: {
    canonical: "/forgot-password",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Forgot Password | NoteHub",
    description:
      "Recover your NoteHub account quickly with a secure password reset flow and return to your notes in minutes.",
    url: "/forgot-password",
    type: "website",
    images: [
      {
        url: "/og-forgot-password.jpg",
        width: 1200,
        height: 630,
        alt: "Recover your NoteHub account",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forgot Password | NoteHub",
    description:
      "Use NoteHub's secure password reset to regain access and get back to your work.",
    images: ["/og-forgot-password.jpg"],
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}