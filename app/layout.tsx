import type { Metadata } from "next";
import {
  Merriweather,
  Roboto,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";

import "katex/dist/katex.min.css";
import "@/styles/katex-overrides.css";
import "@/styles/theme.css";
import "@/styles/tiptap.css";
import "@/styles/hljs.css";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeShortcut } from "@/components/theme-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollaboratorManagerProvider } from "@/contex/CollaboratorManagerContext";
import { CollaboratorsDialog } from "@/components/CollaboratorsDialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";
import { AuthProvider } from "@/components/providers/auth-provider";

import { Toaster } from "sonner";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "400", "700"],
  variable: "--font-roboto",
});
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "400", "700"],
  variable: "--font-source-serif-4",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "NoteHub",
    template: "%s | NoteHub",
  },
  description:
    "NoteHub — a sleek, collaborative platform for capturing, organizing, and sharing notes effortlessly. Designed for students and developers who value clarity and productivity.",
  keywords: [
    "NoteHub",
    "Note App",
    "Markdown Notes",
    "Collaborative Notes",
    "Developer Notes",
    "Study Notes",
    "Productivity App",
    "LaTeX Notes",
  ],
  authors: [{ name: "Abhijeet Singh Rajput aka Mr. Codium" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
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
  themeColor: "#6F00FF",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${merriweather.variable} 
          ${roboto.variable} 
          ${sourceSerif4.variable} 
          antialiased
        `}
      >
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="theme">
            <ThemeShortcut />
            <CollaboratorManagerProvider>
              <TooltipProvider>
                <CollaboratorsDialog />
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <DashboardHeader />
                    {children}
                  </SidebarInset>
                </SidebarProvider>
              </TooltipProvider>
            </CollaboratorManagerProvider>
            
            <Toaster/>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
