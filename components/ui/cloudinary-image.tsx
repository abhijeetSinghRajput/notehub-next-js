// components/ui/smart-image.tsx
import Image, { type ImageLoader, type ImageProps } from "next/image";

type CloudinaryImageProps = Omit<ImageProps, "loader" | "unoptimized">;


const allowedImageDomains = [
  "res.cloudinary.com",
  "lh3.googleusercontent.com",
  // Add more allowed domains here if needed
];

const isAllowedDomain = (src: string) => {
  try {
    const { hostname } = new URL(src);
    return allowedImageDomains.includes(hostname);
  } catch {
    return false;
  }
};

const isCloudinaryUrl = (src: string) => src.includes("res.cloudinary.com");

// Strip any existing Cloudinary transformation params from the URL
// so we don't double-apply them
const stripCloudinaryTransforms = (src: string) =>
  src.replace(/\/upload\/[^/]+\//, "/upload/");

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  if (!isCloudinaryUrl(src)) return src;
  const q = quality ?? 75;
  const clean = stripCloudinaryTransforms(src);
  return clean.replace(
    "/upload/",
    `/upload/f_auto,q_${q},w_${width},c_limit/`
  );
};

export default function CloudinaryImage({ src, ...props }: CloudinaryImageProps) {
  if (typeof src !== "string") {
    // StaticImport — Next.js handles natively
    return <Image src={src} {...props} />;
  }

  if (isCloudinaryUrl(src)) {
    // Use Cloudinary loader — Next.js generates dense srcset,
    // Cloudinary serves exact width + format
    return (
      <Image
        src={src}
        loader={cloudinaryLoader}
        {...props}
      />
    );
  }

  if (isAllowedDomain(src)) {
    // Use Next.js default optimizer for allowed domains
    return <Image src={src} {...props} />;
  }

  // Fallback for unknown domains: use plain <img>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} {...props} />;
}