import {
  Blocks,
  Files,
  GitBranchIcon,
  MousePointer2,
  Search,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Skeleton } from "./ui/skeleton";

/**
 * VSCodeInstallDemo
 * A looping, self-playing motion graphic that recreates: opening the
 * Extensions panel in VS Code, searching "NoteHub Official", clicking the
 * top (fully-loaded) result while the rest render as skeletons, opening
 * the detail page, and clicking Install — then resetting and repeating
 * forever. No real VS Code, no video file — everything is CSS/SVG driven.
 */


// Fixed pixel anchor points as percentages of the container
const POS = {
  neutral: { x: 58.33, y: 5.36 },
  extIcon: { x: 2.5, y: 33.93 },
  search: { x: 9.90, y: 17.18 },
  firstResult: { x: 12.90, y: 25 },
  installBtn: { x: 52, y: 40 },
};

const QUERY = "NoteHub Official";

// timeline with enhanced zoom levels for better visibility
const TIMELINE = [
  { phase: "explorer", dur: 900 },
  {
    phase: "moveExt",
    dur: 700,
    cursor: POS.extIcon,
    zoom: { s: 1.4, x: POS.extIcon.x, y: POS.extIcon.y },
  },
  { phase: "clickExt", dur: 300, click: true },
  { phase: "extOpen", dur: 600 },
  {
    phase: "moveSearch",
    dur: 600,
    cursor: POS.search,
    zoom: { s: 1.8, x: POS.search.x, y: POS.search.y },
  },
  { phase: "clickSearch", dur: 250, click: true },
  { phase: "typing", dur: 1300 },
  {
    phase: "results",
    dur: 900,
    zoom: { s: 1.5, x: POS.firstResult.x, y: POS.firstResult.y },
  },
  { phase: "moveResult", dur: 600, cursor: POS.firstResult },
  { phase: "clickResult", dur: 300, click: true },
  { phase: "detail", dur: 900, zoom: { s: 1.2, x: 50, y: 50 } },
  {
    phase: "moveInstall",
    dur: 600,
    cursor: POS.installBtn,
    zoom: { s: 1.7, x: POS.installBtn.x + 25, y: POS.installBtn.y - 40 },
  },
  { phase: "clickInstall", dur: 300, click: true },
  { phase: "installing", dur: 900 },
  { phase: "installed", dur: 1300 },
  {
    phase: "zoomOut",
    dur: 800,
    zoom: { s: 1, x: 50, y: 50 },
    cursor: POS.neutral,
  },
  { phase: "pause", dur: 700 },
];

export default function VSCodeInstallDemo() {
  const [i, setI] = useState(0);
  const [cursor, setCursor] = useState(POS.neutral);
  const [zoom, setZoom] = useState({ s: 1, x: 50, y: 50 });
  const [clicking, setClicking] = useState(false);
  const [typed, setTyped] = useState("");
  const typeRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const step = TIMELINE[i];
    if (step.cursor) setCursor(step.cursor);
    if (step.zoom) setZoom(step.zoom);
    if (step.click) {
      setClicking(true);
      setTimeout(() => setClicking(false), 260);
    }

    if (step.phase === "typing") {
      let n = 0;
      typeRef.current = setInterval(() => {
        n += 1;
        setTyped(QUERY.slice(0, n));
        if (n >= QUERY.length) clearInterval(typeRef.current!);
      }, 70);
    }
    if (step.phase === "explorer") setTyped("");

    const t = setTimeout(() => {
      setI((prev) => (prev + 1) % TIMELINE.length);
    }, step.dur);

    return () => {
      clearTimeout(t);
      if (typeRef.current) clearInterval(typeRef.current);
    };
  }, [i]);

  const phase = TIMELINE[i].phase;
  const extOpen = !["explorer", "moveExt", "clickExt"].includes(phase);
  const showDetail = [
    "detail",
    "moveInstall",
    "clickInstall",
    "installing",
    "installed",
  ].includes(phase);
  const installed = ["installing", "installed"].includes(phase) ? phase : null;

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
            <div
              className={`relative w-[2.5cqi] h-[2.5cqi] ${extOpen ? "text-foreground" : "text-muted-foreground/55"}`}
            >
              <Blocks className="w-[2.5cqi] h-[2.5cqi]" />
              <span className="absolute -right-[0.625cqi] -bottom-[0.625cqi] bg-[#007acc] text-white text-[0.937cqi] rounded-full px-[0.416cqi] font-semibold leading-[1.25cqi]">
                2
              </span>
            </div>
          </div>

          {/* sidebar: extensions marketplace - always takes space but hidden when closed */}
          <div
            className={`absolute top-[3.125cqi] left-[5cqi] w-[27.08cqi] bottom-0 bg-muted/50 border-r border-border px-[1.46cqi] py-[1.25cqi] box-border transition-all duration-200 ease-in ${
              extOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="text-[1.25cqi] tracking-[0.06em] text-muted-foreground font-semibold mb-[1.04cqi]">
              EXTENSIONS: MARKETPLACE
            </div>
            <div className="bg-muted border border-border rounded h-[2.7cqi] flex items-center px-[0.833cqi] text-[1.25cqi] text-foreground mb-[1.25cqi]">
              {typed}
              {["clickSearch", "typing"].includes(phase) && (
                <span className="inline-block w-[0.1cqi] h-[1.35cqi] bg-foreground ml-[0.052cqi] animate-[blink_1s_step-end_infinite]" />
              )}
            </div>

            {[
              "results",
              "moveResult",
              "clickResult",
              "detail",
              "moveInstall",
              "clickInstall",
              "installing",
              "installed",
            ].includes(phase) && (
              <div>
                <div
                  className={`flex gap-[0.833cqi] p-[0.833cqi] rounded ${
                    ["moveResult", "clickResult"].includes(phase)
                      ? "bg-sidebar-accent"
                      : ""
                  }`}
                >
                  <Image
                    src="/notehub-extension.svg"
                    alt="Notehub"
                    height={28}
                    width={28}
                    className="w-[2.91cqi] h-[2.91cqi] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[1.25cqi] text-foreground font-semibold truncate">
                      NoteHub Official
                    </div>
                    <div className="text-[1.14cqi] text-muted-foreground truncate">
                      MRCodium
                    </div>
                  </div>
                </div>
                <SkeletonResult />
                <SkeletonResult />
              </div>
            )}
          </div>

          {/* main / editor area - adjusts based on sidebar visibility */}
          <div 
            className={`absolute top-[3.125cqi] right-0 bottom-0 bg-card transition-all duration-200 ease-in ${
              extOpen ? "left-[32.08cqi]" : "left-[5cqi]"
            }`}
          >
            <div className="h-[3.54cqi] bg-sidebar border-b border-border flex items-center px-[1.04cqi] gap-[1.66cqi] text-muted-foreground">
              <span className="text-[1.25cqi]">Machine Learning</span>
              <span
                className={`text-[1.25cqi] ${
                  showDetail ? "text-foreground" : "opacity-0"
                }`}
              >
                Extension: NoteHub Official
              </span>
            </div>

            <div
              className={`absolute inset-x-0 top-[3.54cqi] bottom-0 px-[3.125cqi] py-[2.7cqi] transition-all duration-450 ease-in ${
                showDetail
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-[0.156cqi]"
              }`}
            >
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
                    {!installed && (
                      <button className="text-[1.25cqi] px-[1.46cqi] py-[0.52cqi] rounded border-none font-medium bg-[#007acc] text-white">
                        Install
                      </button>
                    )}
                    {installed === "installing" && (
                      <button className="text-[1.25cqi] px-[1.46cqi] py-[0.52cqi] rounded border-none font-medium bg-secondary text-secondary-foreground">
                        Installing…
                      </button>
                    )}
                    {installed === "installed" && (
                      <>
                        <button className="text-[1.25cqi] px-[1.46cqi] py-[0.52cqi] rounded border-none font-medium bg-secondary text-secondary-foreground">
                          Disable
                        </button>
                        <button className="text-[1.25cqi] px-[1.46cqi] py-[0.52cqi] rounded border-none font-medium bg-secondary text-secondary-foreground">
                          Uninstall
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* click ring - using percentage positions */}
          <div
            className={`absolute w-[1.875cqi] h-[1.875cqi] rounded-full border-2 border-primary pointer-events-none z-19 transition-all duration-600 ease-in-out ${
              clicking ? "animate-[ring-pulse_0.5s_ease-out]" : "opacity-0"
            }`}
            style={{ 
              left: `${cursor.x}%`, 
              top: `${cursor.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />

          {/* cursor - using percentage positions */}
          <div
            className="absolute w-[1.875cqi] h-[1.875cqi] pointer-events-none z-20 transition-all duration-600 ease-in-out drop-shadow-lg"
            style={{ 
              left: `${cursor.x}%`, 
              top: `${cursor.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <MousePointer2 className="w-[1.875cqi] h-[1.875cqi] fill-current text-primary" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        @keyframes ring-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.4);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function SkeletonResult() {
  return (
    <div className="flex gap-[0.833cqi] p-[0.833cqi] rounded">
      <Skeleton className="w-[2.91cqi] h-[2.91cqi] shrink-0 rounded" />

      <div className="flex-1 pt-[0.052cqi]">
        <Skeleton className="w-[70%] h-[1.04cqi] rounded mb-[0.156cqi]" />
        <Skeleton className="w-[45%] h-[0.937cqi] rounded" />
      </div>
    </div>
  );
}