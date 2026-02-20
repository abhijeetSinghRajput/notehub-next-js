import { Metadata } from "next";
import { ReactNode } from "react";

// og-signup.jpg
export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free NoteHub account to write smarter notes, organize collections, and collaborate with classmates, teammates, or friends.",
  alternates: {
    canonical: "/signup",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Sign Up | NoteHub",
    description:
      "Join NoteHub to start building organized, shareable notes with markdown support and real-time collaboration.",
    url: "/signup",
    type: "website",
    images: [
      {
        url: "/og-signup.jpg",
        width: 1200,
        height: 630,
        alt: "Create a NoteHub account",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up | NoteHub",
    description:
      "Start with NoteHub today and create notes, collections, and shared knowledge in one place.",
    images: ["/og-signup.jpg"],
  },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
