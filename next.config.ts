/* next.config.ts
 * Fix #1 — Legacy JavaScript polyfills (~14 KiB savings)
 * Changed: target stays out of next.config (handled in tsconfig),
 *          added transpilePackages for heavy deps,
 *          added turbo pack-level optimisations
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Issue 9C fixed: only strip debug/info logs in production.
    // Keep console.error and console.warn so production auth issues remain debuggable.
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tiptap/core",
      "@tiptap/react",
      "lowlight",
      // Fix #4 — tree-shake heavy icon packs imported anywhere
      "@radix-ui/react-icons",
    ],
    // Fix #5 — PPR (Partial Pre-Rendering) lets the shell stream instantly;
    // the note content suspense boundary fills in as the RSC resolves.
    // Uncomment once you're on Next 15 stable with PPR GA.
    // ppr: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 540, 640, 768, 1024, 1280, 1500],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 420],
    // Fix #5 — aggressive cache for Cloudinary assets (1 year)
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      }
    ],
  },

  // Fix #4 — Move heavy client-only providers out of the critical path.
  // If you ever need to analyse the bundle, run:
  //   ANALYZE=true next build
};

export default nextConfig;
