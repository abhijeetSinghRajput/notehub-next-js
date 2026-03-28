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

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/note/types";

/**
 * Returns the id of the TOC heading currently visible nearest the top of
 * the viewport. Uses IntersectionObserver — no forced reflows.
 */
export function useTocTracking(toc: TocItem[]): string {
  const [activeId, setActiveId] = useState<string>("");
  // Keep a ref so the observer callback always sees the latest toc ids
  // without needing to be recreated on every toc change.
  const tocIdsRef = useRef<string[]>([]);

  useEffect(() => {
    tocIdsRef.current = toc.map((item) => item.id);
  }, [toc]);

  useEffect(() => {
    if (toc.length === 0) return;

    // Map of id → entry so we can find the topmost visible heading.
    const visibleMap = new Map<string, IntersectionObserverEntry>();

    const observer = new IntersectionObserver(
      (entries) => {
        // Update our visibility map
        for (const entry of entries) {
          visibleMap.set(entry.target.id, entry);
        }

        // Find the heading that is intersecting AND closest to the top
        // of the viewport (smallest positive boundingClientRect.top).
        let bestId = "";
        let bestTop = Infinity;

        for (const [id, entry] of visibleMap) {
          if (entry.isIntersecting) {
            const top = entry.boundingClientRect.top;
            if (top >= 0 && top < bestTop) {
              bestTop = top;
              bestId = id;
            }
          }
        }

        // If nothing is intersecting (scrolled past all headings or between
        // two headings), keep the last known active id.
        if (bestId) setActiveId(bestId);
      },
      {
        // rootMargin pushes the "visible" zone down from the top by 96px
        // (matches the sticky header height) and uses the full bottom.
        rootMargin: "-96px 0px -20% 0px",
        threshold: 0,
      },
    );

    // Observe all heading elements referenced in the TOC
    const elements: Element[] = [];
    for (const item of toc) {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    }

    return () => {
      for (const el of elements) observer.unobserve(el);
      observer.disconnect();
    };
  }, [toc]);

  return activeId;
}