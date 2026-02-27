"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const prevRoute = useRef(`${pathname}${searchParams}`);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (safetyTimeout.current) clearTimeout(safetyTimeout.current);
    setVisible(true);
    // Safety net: never stay stuck longer than 8 seconds
    safetyTimeout.current = setTimeout(() => setVisible(false), 8000);
  };

  const hide = (delay = 100) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (safetyTimeout.current) clearTimeout(safetyTimeout.current);
    hideTimeout.current = setTimeout(() => setVisible(false), delay);
  };

  // Hide when route actually finishes changing
  useEffect(() => {
    const current = `${pathname}${searchParams}`;
    if (current !== prevRoute.current) {
      prevRoute.current = current;
      hide();
    }
  }, [pathname, searchParams]);

  // Show on internal link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Skip modified clicks (new tab, new window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Skip non-left-click (middle click opens new tab)
      if (e.button !== 0) return;

      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      // Skip target="_blank" and download links
      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";

      // Skip external, hash-only, and non-path links
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (href.startsWith("#")) return;

      // Strip hash from href before comparing (e.g. /page#section)
      const hrefPath = href.split("#")[0];
      if (!hrefPath || hrefPath === prevRoute.current) return;

      show();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Show on router.push() — but not replaceState (Next.js calls it internally)
  // and not popstate (back/forward to cached pages is instant)
  useEffect(() => {
    const originalPushState = window.history.pushState;

    window.history.pushState = function (...args) {
      const newUrl = typeof args[2] === "string" ? args[2] : null;
      // Only show if actually navigating to a different route
      if (newUrl && newUrl.split("?")[0] !== prevRoute.current.split("?")[0]) {
        show();
      }
      return originalPushState.apply(this, args);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      if (safetyTimeout.current) clearTimeout(safetyTimeout.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes nav-slide {
          0%   { left: -38%; }
          100% { left: 110%; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          zIndex: 9999,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-38%",
            width: "38%",
            height: "100%",
            borderRadius: "9999px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 15%, rgba(99, 102, 241, 1) 40%, rgba(139, 92, 246, 1) 55%, rgba(217, 70, 239, 1) 70%, rgba(99, 102, 241, 0.4) 88%, transparent 100%)",
            animation: "nav-slide 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-38%",

            width: "38%",
            height: "100%",
            borderRadius: "9999px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 15%, rgba(99, 102, 241, 1) 40%, rgba(139, 92, 246, 1) 55%, rgba(217, 70, 239, 1) 70%, rgba(99, 102, 241, 0.4) 88%, transparent 100%)",
            animation: "nav-slide 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            animationDelay: "1.05s",
          }}
        />
      </div>
    </>
  );
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
