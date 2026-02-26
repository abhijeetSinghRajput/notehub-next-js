import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button';

// ─── Image lightbox ────────────────────────────────────────────────────────────
type ImageLightboxProps = {
  src: string;
  onClose: () => void;
};

const ImageLightbox = memo(({ src, onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 4));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "0") { setScale(1); setPosition({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y };
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setPosition({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const reset = useCallback(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
        >
          <ZoomOut className="size-4" />
        </Button>
        <span className="text-white/70 text-sm font-mono min-w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          onClick={reset}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Image */}
      <div
        className="relative flex items-center justify-center w-full h-full"
        onMouseDown={handleMouseDown}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Preview"
          draggable={false}
          className="select-none rounded-lg shadow-2xl"
          style={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            objectFit: "contain",
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? "none" : "transform 0.15s ease",
            willChange: "transform",
          }}
        />
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
        Scroll to zoom · Drag to pan · Esc to close
      </p>
    </div>
  );
});
ImageLightbox.displayName = "ImageLightbox";

export default ImageLightbox
