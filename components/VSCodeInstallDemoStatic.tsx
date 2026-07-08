import {
  Blocks,
  Files,
  GitBranchIcon,
  MousePointer2,
  Search,
} from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";

// Fixed pixel anchor points as percentages of the container
const POS = {
  neutral: { x: 58.33, y: 5.36 },
  extIcon: { x: 2.5, y: 33.93 },
  search: { x: 9.9, y: 17.18 },
  firstResult: { x: 12.9, y: 25 },
  installBtn: { x: 52, y: 40 },
};

export default function VSCodeInstallDemoStatic() {
  const [cursor] = useState(POS.neutral);
  const [zoom] = useState({ s: 1, x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert percentage positions to pixel positions for the transform origin
  const getPixelPosition = (x: number, y: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    return {
      x: (x / 100) * containerWidth,
      y: (y / 100) * containerHeight,
    };
  };

  const pixelPos = getPixelPosition(zoom.x, zoom.y);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto overflow-hidden border border-border bg-card @container"
    >
      <div className="relative w-full" style={{ aspectRatio: "960 / 560" }}>
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-750 ease-in-out"
          style={{
            transform: `scale(${zoom.s})`,
            transformOrigin: `${pixelPos.x}px ${pixelPos.y}px`,
          }}
        >
          {/* title bar */}
          <div className="absolute top-0 left-0 right-0 h-[3.125cqi] bg-sidebar flex items-center px-[1.04cqi] gap-[0.625cqi] border-b border-border">
            <span className="w-[1.04cqi] h-[1.04cqi] rounded-full bg-[#ff5f57]" />
            <span className="w-[1.04cqi] h-[1.04cqi] rounded-full bg-[#febc2e]" />
            <span className="w-[1.04cqi] h-[1.04cqi] rounded-full bg-[#28c840]" />
          </div>

          {/* activity bar - always visible */}
          <div className="absolute top-[3.125cqi] left-0 w-[5cqi] bottom-0 bg-muted flex flex-col items-center pt-[1.04cqi] gap-[2.29cqi]">
            <Files className="w-[2.5cqi] h-[2.5cqi] text-muted-foreground/55" />
            <Search className="w-[2.5cqi] h-[2.5cqi] text-muted-foreground/55" />
            <GitBranchIcon className="w-[2.5cqi] h-[2.5cqi] text-muted-foreground/55" />
            <div className="relative w-[2.5cqi] h-[2.5cqi] text-primary">
              <Blocks className="w-[2.5cqi] h-[2.5cqi]" />
              <span className="absolute -right-[0.625cqi] -bottom-[0.625cqi] bg-[#007acc] text-white text-[0.937cqi] rounded-full px-[0.416cqi] font-semibold leading-[1.25cqi]">
                2
              </span>
            </div>
          </div>

          {/* main / editor area */}
          <div className="absolute top-[3.125cqi] left-[5cqi] bottom-0 w-full bg-card">
            <div className="h-[3.54cqi] bg-sidebar border-b border-border flex items-center px-[1.04cqi] gap-[1.66cqi] text-muted-foreground">
              <span className="text-[1.25cqi]">Machine Learning</span>
              <span className="text-[1.25cqi] text-foreground">
                Extension: NoteHub Official
              </span>
            </div>

            <div className="absolute inset-x-0 top-[3.54cqi] bottom-0 px-[3.125cqi] py-[2.7cqi] opacity-100">
              <div className="flex gap-[2.29cqi] items-start">
                <Image
                  src="/notehub-extension.svg"
                  alt="Notehub"
                  height={90}
                  width={90}
                  className="w-[9.37cqi] h-[9.37cqi] shrink-0"
                />
                <div>
                  <div className="text-[2.5cqi] font-bold text-foreground">
                    NoteHub Official
                  </div>
                  <div className="text-[1.45cqi] text-muted-foreground mt-[0.156cqi]">
                    MRCodium · downloads 1
                  </div>
                  <div className="text-[1.45cqi] text-foreground/80 mt-[0.26cqi] max-w-[43.75cqi]">
                    Browse your NoteHub collections and notes right in the VS
                    Code sidebar, with a rich-text note viewer.
                  </div>
                  <div className="mt-[0.416cqi] flex gap-[0.833cqi]">
                    <button className="text-[1.25cqi] px-[1.46cqi] py-[0.52cqi] rounded border-none font-medium bg-[#007acc] text-white">
                      Install
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* cursor */}
          <div
            className="absolute w-[1.875cqi] h-[1.875cqi] pointer-events-none z-20 drop-shadow-lg"
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <MousePointer2 className="w-[1.875cqi] h-[1.875cqi] fill-current text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}