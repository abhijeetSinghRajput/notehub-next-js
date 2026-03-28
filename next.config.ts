import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tiptap/core",
      "@tiptap/react",
      "lowlight",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Denser breakpoints — covers 388px, 426px, 441px display sizes
    deviceSizes: [320, 420, 540, 640, 768, 1024, 1280, 1500],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 420],
    
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
      },
    ],
  },
};

export default nextConfig;