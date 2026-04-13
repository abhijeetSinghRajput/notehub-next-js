/* app/layout.tsx */

import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";
import "@/styles/theme.css";
import "@/styles/tiptap-perf.css";
import "@/styles/tiptap.css";
import "@/styles/hljs.css";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeShortcut } from "@/components/theme-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
// Fix #4 — AppShell now conditionally renders CollaboratorManagerProvider
//          only when the user is signed in (see AppShell changes below).
import AppShell from "@/components/providers/AppShell";

import { Toaster } from "sonner";
import React from "react";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",       //  Next.js was synthesising it (wasted bytes)
  display: "swap",
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NoteHub",
  url: baseUrl,
  logo: {
    "@type": "ImageObject",
    url: `${baseUrl}/icon.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    "https://github.com/abhijeetSinghRajput",
    "https://www.linkedin.com/in/abhijeet-singh-rajput1/",
    "https://www.youtube.com/@mrcodium",
    "https://x.com/abhijeet62008",
  ],
  description:
    "NoteHub — a collaborative platform for capturing, organizing, and sharing notes. Built for students and developers.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NoteHub",
  url: baseUrl,
};

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
    default: "NoteHub | Smart Note-Taking for Developers & Students",
    template: "%s | NoteHub",
  },
  description:
    "NoteHub — a collaborative platform for capturing, organizing, and sharing notes effortlessly. Built for students and developers.",
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
        {/* ✅ MUST be first — runs before browser paints anything */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark');d.classList.remove('light');}else{d.classList.add('light');d.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        {/* Backend warm-up */}
        <link
          rel="preconnect"
          href="https://notehub-38kp.onrender.com"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://notehub-38kp.onrender.com" />
      </head>
      <body className={`${roboto.variable} antialiased`}>
        <NextTopLoader
          color="#6366f1"
          height={4}
          showSpinner={false}
          easing="cubic-bezier(0.4,0,0.2,1)"
          speed={200}
        />

        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="theme">
            <ThemeShortcut />
            <TooltipProvider>
              <AppShell>{children}</AppShell>
            </TooltipProvider>
            <Toaster />
            <SpeedInsights />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}