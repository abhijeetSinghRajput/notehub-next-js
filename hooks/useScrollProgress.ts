/* hooks/useScrollProgress.ts
 * Fix #7 — Forced reflow audit
 *
 * The original implementation was already using passive listener + rAF,
 * which is correct. No reflow here.
 *
 * One micro-fix: cache `document.documentElement.scrollHeight` outside
 * the rAF so we don't force a layout recalc on every scroll frame.
 * scrollHeight is stable between paints so reading it once per event
 * (before rAF queues) is safe.
 */
"use client";

import { useEffect, useState } from "react";

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      // Fix #7 — read scrollHeight here (sync, pre-rAF) so the rAF
      // callback itself never triggers a forced style recalculation.
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      ticking = true;

      requestAnimationFrame(() => {
        setProgress(
          total > 0
            ? Math.min(100, Math.round((window.scrollY / total) * 100))
            : 0,
        );
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}