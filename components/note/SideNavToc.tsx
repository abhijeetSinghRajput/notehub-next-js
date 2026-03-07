"use client";

import { memo, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/note/types";

export type SideNavTocProps = {
  toc: TocItem[];
  activeId: string | null;
  onItemClick: (id: string) => void;
};

const TICK_WIDTH: Record<number, { base: string; hover: string }> = {
  1: { base: "w-5", hover: "group-hover/nav:w-[26px]" },
  2: { base: "w-3.5", hover: "group-hover/nav:w-[18px]" },
  3: { base: "w-2", hover: "group-hover/nav:w-3" },
};

const POPOVER_INDENT: Record<number, string> = {
  1: "pl-3.5",
  2: "pl-6",
  3: "pl-9",
};

/**
 * Notion-inspired side-rail TOC: thin tick marks on the right edge that expand
 * into a floating popover on hover. Hidden on small screens.
 */
const TICK_GAP = 12; // uniform px gap between ticks

const SideNavToc = memo<SideNavTocProps>(
  ({ toc, activeId, onItemClick }) => {
    const [isHovering, setIsHovering] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

    const showPopover = useCallback(() => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setIsHovering(true);
    }, []);

    const startHide = useCallback(() => {
      hideTimer.current = setTimeout(() => setIsHovering(false), 120);
    }, []);

    if (toc.length < 2) return null;

    return (
      <nav
        className="group/nav fixed right-0 top-0 bottom-0 z-40 w-9 hidden lg:block"
        onMouseEnter={showPopover}
        onMouseLeave={startHide}
        aria-label="Table of contents"
      >
        {/* ── Tick marks: vertically centered, 12px gap ── */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-start pl-2"
          style={{ gap: `${TICK_GAP}px` }}
        >
          {toc.map((item) => {
            const level = Math.min(Math.max(item.level, 1), 3) as 1 | 2 | 3;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "h-0.5 rounded-full transition-all duration-150",
                  "bg-muted-foreground/25 hover:bg-muted-foreground/50 hover:h-[3px]",
                  activeId === item.id && "!bg-primary hover:!bg-primary",
                  TICK_WIDTH[level].base,
                  TICK_WIDTH[level].hover,
                )}
                aria-label={item.text}
              />
            );
          })}
        </div>

        {/* ── Popover ── */}
        <div
          className={cn(
            "fixed right-2 top-1/2 -translate-y-1/2 w-[232px]",
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
            <div className="max-h-[60vh] overflow-y-auto pr-1">
                {toc.map((item) => {
                  const level = Math.min(Math.max(item.level, 1), 3) as 1 | 2 | 3;
                  const isActive = activeId === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item.id)}
                      className={cn(
                        "flex items-center w-full py-[5px] pr-3 text-left",
                        "transition-colors duration-100 hover:bg-muted/60",
                        isActive && "bg-muted/80",
                        POPOVER_INDENT[level],
                      )}
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
                })}
              </div>
          </div>
        </div>
      </nav>
    );
  },
);
SideNavToc.displayName = "SideNavToc";

export default SideNavToc;
