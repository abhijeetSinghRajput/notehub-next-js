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

const isSvgUrl = (src: string) => {
  const lowercase = src.toLowerCase();
  return lowercase.endsWith(".svg") || lowercase.includes(".svg") || lowercase.includes(".svg?");
};

const isGifUrl = (src: string) => {
  const lowercase = src.toLowerCase();
  return lowercase.endsWith(".gif") || lowercase.includes(".gif?");
};

// Strip any existing Cloudinary transformation params from the URL
// so we don't double-apply them. Uses a negative lookahead to preserve
// version segments like /v1234567890/ while removing transform segments.
const stripCloudinaryTransforms = (src: string) =>
  src.replace(/\/upload\/(?![v\d])([^/]+)\//, "/upload/");

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  if (!isCloudinaryUrl(src)) return src;
  // SVG and GIF must not be transformed
  if (isSvgUrl(src) || isGifUrl(src)) return src;
  const q = quality ?? 75;
  const clean = stripCloudinaryTransforms(src);
  return clean.replace(
    "/upload/",
    `/upload/f_auto,q_${q},w_${width},c_limit/`
  );
};

export default function CloudinaryImage({ src, alt, ...props }: CloudinaryImageProps) {
  const altText = alt ?? "";

  if (typeof src !== "string") {
    // StaticImport — Next.js handles natively
    return <Image src={src} alt={altText} {...props} />;
  }

  if (isCloudinaryUrl(src)) {
    // SVG and GIF must bypass the optimizer to preserve their format/animation
    if (isSvgUrl(src) || isGifUrl(src)) {
      return <Image src={src} alt={altText} unoptimized {...props} />;
    }
    // Use Cloudinary loader — Next.js generates a dense srcset,
    // Cloudinary serves the exact requested width + auto format
    return (
      <Image
        src={src}
        alt={altText}
        loader={cloudinaryLoader}
        {...props}
      />
    );
  }

  if (isAllowedDomain(src)) {
    // Use Next.js default optimizer for allowed domains
    return <Image src={src} alt={altText} {...props} />;
  }

  // Fallback for unknown domains: use plain <img>
  // eslint-disable-next-line @next/next/no-img-element
  // Filter out Next.js-specific props that shouldn't go to <img>
  const { fill: _fill, ...imgProps } = props;
  return <img src={src} alt={altText} {...imgProps} />;
}