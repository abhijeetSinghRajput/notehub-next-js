"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { computeTocIndentLevels } from "@/utils/tocIndent";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/note/types";

export type SideNavTocProps = {
  toc: TocItem[];
  activeId: string | null;
  onItemClick: (id: string) => void;
};

const TICK_WIDTH: Record<number, string> = {
  1: "w-5",
  2: "w-3.5",
  3: "w-2",
};

const INDENT_STEP = 20;
const TICK_GAP = 12;

/**
 * Notion-inspired side-rail TOC: thin tick marks on the right edge that expand
 * into a floating popover on hover. Hidden on small screens.
 *
 * The nav element is wide enough to cover both the tick strip and the gutter
 * between the ticks and the popover, so moving through the gutter never
 * triggers onMouseLeave on the nav — the popover stays open.
 */
const SideNavToc = memo<SideNavTocProps>(({ toc, activeId, onItemClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const navRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const showPopover = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsHovering(true);
  }, []);

  const startHide = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      // Only hide if the mouse has truly left the entire nav zone (incl. gutter)
      if (navRef.current?.matches(":hover")) return;
      setIsHovering(false);
    }, 120);
  }, []);

  useEffect(() => {
    if (!isHovering) return;
    if (!activeItemRef.current || !scrollContainerRef.current) return;
    activeItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isHovering]);

  if (toc.length < 2) return null;

  return (
    <nav
      ref={navRef}
      // so the mouse never leaves the nav while traversing the gutter
      className="group/nav fixed h-[65vh] right-0 top-1/2 -translate-y-1/2 bottom-0 z-40 w-16 hidden lg:block"
      onMouseEnter={showPopover}
      onMouseLeave={startHide}
      aria-label="Table of contents"
    >
      {/* ── Tick marks ── */}
      <div
        className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-start pl-2 max-h-[60vh] overflow-hidden"
        style={{ gap: `${TICK_GAP}px` }}
      >
        {toc.map((item) => {
          const level = Math.min(Math.max(item.level, 1), 3) as 1 | 2 | 3;
          return (
            <div
              key={item.id}
              className={cn(
                "h-0.5 min-h-0.5 rounded-full transition-all duration-150",
                "bg-muted-foreground/50",
                activeId === item.id &&
                  "bg-primary! shadow-[0_0_6px_1.5px_var(--color-primary)] shadow-primary/30",
                TICK_WIDTH[level],
              )}
            />
          );
        })}
      </div>

      {/* ── Popover: gutter preserved via right-2 ── */}
      <div
        className={cn(
          "fixed right-2 top-1/2 -translate-y-1/2 w-58",
          "bg-popover border border-border rounded-xl shadow-lg",
          "transition-all duration-150 ease-out",
          isHovering
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-1.5 pointer-events-none",
        )}
        onMouseEnter={showPopover}
        onMouseLeave={startHide}
      >
        <div className="py-2.5">
          <div ref={scrollContainerRef} className="max-h-[60vh] overflow-y-auto pr-1">
            {(() => {
              const indentLevels = computeTocIndentLevels(toc);
              return toc.map((item, idx) => {
                const level = Math.min(Math.max(item.level, 1), 3) as 1 | 2 | 3;
                const isActive = activeId === item.id;
                const indent = indentLevels[idx] * INDENT_STEP + 8;
                return (
                  <button
                    key={item.id}
                    ref={isActive ? activeItemRef : null}
                    onClick={() => onItemClick(item.id)}
                    className={cn(
                      "flex items-center w-full py-1.25 pr-3 text-left",
                      "transition-colors duration-100 hover:bg-muted/60",
                      isActive && "bg-muted/80",
                    )}
                    style={{ paddingLeft: `${indent}px` }}
                  >
                    <span
                      className={cn(
                        "font-mono text-[11.5px] leading-snug truncate transition-colors duration-100",
                        level === 1
                          ? "text-foreground font-medium text-xs"
                          : "text-muted-foreground",
                        isActive && "text-foreground",
                      )}
                    >
                      {item.text}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </nav>
  );
});
SideNavToc.displayName = "SideNavToc";

export default SideNavToc;