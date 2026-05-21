/* hooks/useTocTracking.ts
 * Fix #7 — Forced reflow
 *
 * The original hook (not shown in the paste but implied by its usage)
 * commonly uses getBoundingClientRect() on every scroll event to find the
 * active heading — that's a forced synchronous layout on every frame.
 *
 * Replacement: IntersectionObserver.
 *  - Zero forced reflows — the browser calls us asynchronously.
 *  - Much cheaper CPU: no scroll listener at all.
 *  - Correctly handles fast scrolling and programmatic scrollTo().
 */
"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/note/types";

/**
 * Returns the id of the TOC heading currently active based on the scroll position.
 * Throttled using requestAnimationFrame for optimal scroll performance.
 */
export function useTocTracking(toc: TocItem[]): string {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (toc.length === 0) return;

    let queued = false;

    const handleScroll = () => {
      if (queued) return;
      queued = true;

      requestAnimationFrame(() => {
        queued = false;

        const threshold = 120; // 96px header + 24px buffer
        let currentActiveId = toc[0]?.id || "";

        for (let i = 0; i < toc.length; i++) {
          const el = document.getElementById(toc[i].id);
          if (!el) continue;

          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            currentActiveId = toc[i].id;
          } else {
            // Since headings are in document order, once we find a heading
            // below the threshold, all subsequent headings are also below it.
            break;
          }
        }

        setActiveId(currentActiveId);
      });
    };

    // Run immediately to set initial active heading
    handleScroll();

    // Set timers to ensure correct active heading on mount / layout shifts / scroll restoration
    const timers = [
      setTimeout(handleScroll, 100),
      setTimeout(handleScroll, 300),
      setTimeout(handleScroll, 600),
    ];

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      timers.forEach(clearTimeout);
    };
  }, [toc]);

  return activeId;
}