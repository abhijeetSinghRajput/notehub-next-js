"use client";

import dynamic from "next/dynamic";
import React, { memo, useMemo } from "react";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Download from "yet-another-react-lightbox/plugins/download";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
});

type ImageLightboxSlide = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

type ImageLightboxProps = {
  src?: string;
  slides?: ImageLightboxSlide[];
  index?: number;
  onClose: () => void;
};

const ImageLightbox = memo(
  ({ src, slides, index = 0, onClose }: ImageLightboxProps) => {
    const resolvedSlides = useMemo(() => {
      if (slides && slides.length > 0) return slides;
      if (src) return [{ src }];
      return [] as ImageLightboxSlide[];
    }, [slides, src]);

    if (resolvedSlides.length === 0) return null;

    const safeIndex = Math.min(
      Math.max(index, 0),
      Math.max(resolvedSlides.length - 1, 0),
    );

    const hasMultipleSlides = resolvedSlides.length > 1;

    return (
      <Lightbox
        open
        close={onClose}
        slides={resolvedSlides}
        index={safeIndex}
        plugins={
          hasMultipleSlides
            ? [Fullscreen, Download, Slideshow, Zoom, Thumbnails]
            : [Fullscreen, Download, Zoom]
        }
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        carousel={{ finite: !hasMultipleSlides }}
        thumbnails={
          hasMultipleSlides
            ? {
                showToggle: false,
                position: "bottom",
              }
            : undefined
        }
        render={
          hasMultipleSlides
            ? undefined
            : {
                buttonPrev: () => null,
                buttonNext: () => null,
              }
        }
        controller={{ closeOnBackdropClick: true }}
      />
    );
  },
);

ImageLightbox.displayName = "ImageLightbox";

export default ImageLightbox;
