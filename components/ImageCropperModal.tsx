"use client";

import React, { useState, useCallback } from "react";
import Cropper, { type CropperProps } from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Check, X, RotateCcw, Crop } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Canvas helper to produce a cropped Blob ─────────────────────────────────
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth?: number,
  outputHeight?: number
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous"); // needed to avoid tainted-canvas errors
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // If explicit output dimensions requested (cover: 767×192), use them
  canvas.width = outputWidth ?? pixelCrop.width;
  canvas.height = outputHeight ?? pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.92
    );
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ImageCropperModalProps {
  /** Object-URL (URL.createObjectURL) or data-URL of the image to crop */
  src: string;
  /**
   * Crop aspect ratio.
   * Pass `1` for square avatar, `767 / 192` (≈ 3.99) for cover.
   */
  aspect: number;
  /**
   * Whether to show a circular crop overlay (avatar).
   * The saved image is still a square JPEG; the circle is purely cosmetic.
   */
  circular?: boolean;
  /** Called with the resulting Blob when the user clicks Confirm */
  onConfirm: (blob: Blob) => void;
  /** Called when the user cancels or closes the modal */
  onClose: () => void;
  /** Human-readable label shown in the modal header */
  label?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImageCropperModal({
  src,
  aspect,
  circular = false,
  onConfirm,
  onClose,
  label = "Crop Image",
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsConfirming(true);
    try {
      // For cover, output exactly 767×192; avatar keeps natural crop size
      const isCover = aspect !== 1 && aspect > 1.5;
      const outW = isCover ? 768 : undefined;
      const outH = isCover ? 192 : undefined;
      const blob = await getCroppedImageBlob(src, croppedAreaPixels, outW, outH);
      onConfirm(blob);
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Prompt text per mode
  const prompt =
    aspect === 1
      ? "Drag to reposition · scroll or pinch to zoom · crops to a square"
      : "Drag to reposition · scroll or pinch to zoom · cover displays at 768 × 192 px";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal card */}
      <div className="relative flex flex-col bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2.5">
            <Crop className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm tracking-wide">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Crop area ── */}
        <div className="relative w-full bg-black" style={{ height: 340 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circular ? "round" : "rect"}
            showGrid={!circular}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "2px solid hsl(var(--primary))",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
              },
            }}
          />
        </div>

        {/* ── Zoom control ── */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
              className="size-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </button>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
              aria-label="Zoom"
            />
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="size-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </button>
          </div>
          {/* Prompt */}
          <p className="text-[11px] text-muted-foreground text-center mt-2 leading-snug">
            {prompt}
          </p>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/10 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isConfirming || !croppedAreaPixels}
              className="gap-1.5 min-w-24"
            >
              {isConfirming ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Cropping…
                </span>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Apply Crop
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
