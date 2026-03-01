import type { Metadata } from "next";
import { Merriweather, Roboto, Source_Serif_4 } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

import "katex/dist/katex.min.css";
import "@/styles/katex-overrides.css";
import "@/styles/theme.css";
import "@/styles/tiptap.css";
import "@/styles/hljs.css";
import "@/styles/mermaid-theme.css";


import { ThemeProvider } from "@/components/theme-provider";
import { ThemeShortcut } from "@/components/theme-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollaboratorManagerProvider } from "@/contex/CollaboratorManagerContext";
import { CollaboratorsDialog } from "@/components/CollaboratorsDialog";
import { AuthProvider } from "@/components/providers/auth-provider";
import AppShell from "@/components/providers/AppShell";

import { Toaster } from "sonner";
import { NavigationLoader } from "@/components/NavigationLoader";

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
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://notehub-38kp.onrender.com"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://notehub-38kp.onrender.com" />
      </head>
      <body
        className={`
          ${merriweather.variable} 
          ${roboto.variable} 
          ${sourceSerif4.variable} 
          antialiased
        `}
      >
        <NavigationLoader />

        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="theme">
            <ThemeShortcut />
            <CollaboratorManagerProvider>
              <TooltipProvider>
                <CollaboratorsDialog />
                <AppShell>{children}</AppShell>
              </TooltipProvider>
            </CollaboratorManagerProvider>

            <Toaster />
            <SpeedInsights />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
