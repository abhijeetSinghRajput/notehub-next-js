import { NextResponse } from "next/server";

const BACKEND_URL = "https://notehub-38kp.onrender.com";
const SITE_URL =  process.env.NEXT_PUBLIC_BASE_URL || "https://notehub-official.vercel.app";

// Route segment config — revalidate once per hour (matches backend cache TTL)
export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/sitemap.xml?siteUrl=${SITE_URL}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Backend sitemap responded with ${res.status}`);

    const xml = await res.text();

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("❌ Sitemap proxy failed:", err);

    // Minimal fallback so sitemap never returns a hard error
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallback, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }
}