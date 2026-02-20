import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your NoteHub account to access your notes and collections.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
