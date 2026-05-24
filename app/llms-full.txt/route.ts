import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://notehub-38kp.onrender.com/api";
const BACKEND_URL = API_URL.replace(/\/api$/, "");
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://notehub-official.vercel.app";

// Revalidate once per hour
export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/llms-full.txt?siteUrl=${SITE_URL}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Backend llms-full.txt responded with ${res.status}`);

    const text = await res.text();

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("❌ llms-full.txt proxy failed:", err);

    // Fallback in case of server error
    const fallback = `# NoteHub - Full Technical Notes Corpus

> A collaborative blog and note publishing platform for developers and students.

- URL: ${SITE_URL}
`;

    return new NextResponse(fallback, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
