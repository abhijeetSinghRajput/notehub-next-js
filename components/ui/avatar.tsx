import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { getImageProps } from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

function AvatarImage(
  props: React.ComponentProps<typeof AvatarPrimitive.Image>,
) {
  const { src, alt, width, height, ...rest } = props;

  // If no src or src is a Blob, fallback to original behavior
  if (!src || src instanceof Blob) {
    return <AvatarPrimitive.Image {...props} />;
  }

  // Type guard to ensure src is string 
  const isValidImageSrc = (
    src: unknown
  ): src is string | StaticImport => {
    return (
      typeof src === "string" ||
      (typeof src === "object" && src !== null && "src" in src)
    );
  };

  if (!isValidImageSrc(src)) {
    return <AvatarPrimitive.Image {...props} />;
  }

  const size =
    width && height
      ? { width: Number(width), height: Number(height) }
      : { fill: true };

  let nextOptimizedProps: React.ComponentProps<typeof AvatarPrimitive.Image> =
    props;

  try {
    // This is the key line that makes Next.js image optimization take effect
    const { props: computed } = getImageProps({
      src,
      alt: String(alt),
      ...size,
      ...rest,
    });
    nextOptimizedProps = computed as React.ComponentProps<typeof AvatarPrimitive.Image>;
  } catch (error) {
    // If getImageProps fails, fallback to original behavior
    console.warn("Failed to optimize image:", error);
  }

  return <AvatarPrimitive.Image {...nextOptimizedProps} />;
}
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };