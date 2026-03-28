// components/ui/smart-image.tsx
import Image, { type ImageProps } from "next/image";

type SmartImageProps = Omit<ImageProps, "unoptimized">;

const isCloudinaryUrl = (src: string) =>
  src.includes("res.cloudinary.com");

const isCloudinaryOptimized = (src: string) =>
  src.includes("/upload/f_auto") || src.includes("/upload/q_auto");

// Generate Cloudinary srcset by replacing w_ with different widths
const buildCloudinarySrcset = (
  src: string,
  widths = [320, 640, 768, 1080, 1280, 1500],
) => {
  return widths
    .map((w) => {
      const url = src.replace(/w_\d+/, `w_${w}`);
      return `${url} ${w}w`;
    })
    .join(", ");
};

export default function SmartImage({
  src,
  sizes,
  ...props
}: SmartImageProps) {
  if (typeof src !== "string") {
    return <Image src={src} sizes={sizes} {...props} />;
  }

  const cloudinary = isCloudinaryUrl(src);
  const optimized = cloudinary && isCloudinaryOptimized(src);

  // Cloudinary optimized → use native <img> with manual srcset
  if (optimized) {
    const { width, height, alt, className, style, ...rest } = props as any;
    const srcset = buildCloudinarySrcset(src);

    return (
      <img
        src={src}
        srcSet={srcset}
        sizes={sizes as string}
        width={width}
        height={height}
        alt={alt}
        className={className}
        style={style}
        loading={rest.loading ?? "lazy"}
        fetchPriority={rest.fetchPriority}
        decoding="async"
      />
    );
  }

  // Non-Cloudinary or unoptimized Cloudinary → let Next.js handle
  return <Image src={src} sizes={sizes} {...props} />;
}