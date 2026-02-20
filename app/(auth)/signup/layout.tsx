import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free NoteHub account to start organizing your notes and collaborating with others.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
