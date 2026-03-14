"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/note/types";

export function useTocTracking(toc: TocItem[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        let current: string | null = null;
        for (const item of toc) {
          const el = document.getElementById(item.id);
          if (el && el.getBoundingClientRect().top <= 120) current = item.id;
          else break;
        }
        setActiveId(current);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  return activeId;
}