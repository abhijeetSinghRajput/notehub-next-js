import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to NoteHub to access your personal notes, collections, and collaborative workspaces with a secure, seamless login experience.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Login | NoteHub",
    description:
      "Access your NoteHub dashboard to continue writing, organizing, and sharing notes with your team.",
    url: "/login",
    type: "website",
    images: [
      {
        url: "/og-login.jpg",
        width: 1200,
        height: 630,
        alt: "Login to NoteHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | NoteHub",
    description:
      "Sign in to NoteHub and pick up your notes, collections, and collaborations instantly.",
    images: ["/og-login.jpg"],
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
