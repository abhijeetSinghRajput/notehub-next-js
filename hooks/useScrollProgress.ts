"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the scroll progress as a percentage (0–100).
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const { scrollY, innerHeight } = window;
        const total = document.documentElement.scrollHeight - innerHeight;
        setProgress(total > 0 ? Math.min(100, Math.round((scrollY / total) * 100)) : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}
