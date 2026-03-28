// components/ui/smart-image.tsx
import Image, { type ImageLoader, type ImageProps } from "next/image";

type CloudinaryImageProps = Omit<ImageProps, "loader" | "unoptimized">;

const isCloudinaryUrl = (src: string) =>
  src.includes("res.cloudinary.com");

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

  // Google avatars, local files — Next.js default optimizer
  return <Image src={src} {...props} />;
}