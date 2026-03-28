// components/article-card/ImageCarousel.tsx
"use client";

import { memo, useCallback, useEffect, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import ImageLightbox from "@/components/ImageLightbox";

interface ImageData {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: ImageData[];
}

// Static placeholder shown before carousel JS initializes (avoids layout shift)
function StaticImage({ image }: { image: ImageData }) {
  return (
    <div className="w-full md:w-[40%] shadow-md border rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <CloudinaryImage
          src={image.src}
          alt={image.alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
          loading="lazy"
          fetchPriority="low"
        />
      </div>
    </div>
  );
}

export const ImageCarousel = memo<ImageCarouselProps>(({ images }) => {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [current, setCurrent] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [enableCarousel, setEnableCarousel] = useState(false);

  // Defer carousel init until after LCP
  useEffect(() => {
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(() => setEnableCarousel(true));
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setEnableCarousel(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSetApi = useCallback((emblaApi?: EmblaCarouselType) => {
    if (!emblaApi) return;
    setApi(emblaApi);
    setCurrent(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (!enableCarousel) {
    return <StaticImage image={images[0]} />;
  }

  return (
    <>
      <div className="w-full md:w-[40%] shadow-md border rounded-lg overflow-hidden">
        <Carousel className="w-full relative" setApi={handleSetApi}>
          <CarouselContent>
            {images.map((img, index) => (
              <CarouselItem key={`${img.src}-${index}`}>
                <div
                  className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <CloudinaryImage
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    loading="lazy"
                    fetchPriority="low"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 hidden sm:flex">
                <ChevronLeft className="h-4 w-4" />
              </CarouselPrevious>
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 hidden sm:flex">
                <ChevronRight className="h-4 w-4" />
              </CarouselNext>

              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`w-2 h-2 shadow-md rounded-full transition-all ${
                      current === index
                        ? "bg-primary w-3"
                        : "bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </Carousel>
      </div>

      {selectedImageIndex !== null && (
        <ImageLightbox
          slides={images}
          index={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
});

ImageCarousel.displayName = "ImageCarousel";