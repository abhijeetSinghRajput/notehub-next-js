"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const prevRoute = useRef(`${pathname}${searchParams}`);

  useEffect(() => {
    setVisible(true);

    const hide = () => setVisible(false);

    if (document.readyState === "complete") {
      const timeout = window.setTimeout(hide, 300);
      return () => window.clearTimeout(timeout);
    }

    window.addEventListener("load", hide, { once: true });
    const fallback = window.setTimeout(hide, 1500);

    return () => {
      window.removeEventListener("load", hide);
      window.clearTimeout(fallback);
    };
  }, []);

  // Hide when route finishes loading
  useEffect(() => {
    const current = `${pathname}${searchParams}`;
    if (current !== prevRoute.current) {
      prevRoute.current = current;
      setVisible(false);
    }
  }, [pathname, searchParams]);

  // Show on any internal <a> click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const isInternal =
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !href.startsWith("#");
      if (isInternal && href !== prevRoute.current) setVisible(true);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Show on programmatic navigations too (router.push/replace trigger history updates)
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      setVisible(true);
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      setVisible(true);
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => setVisible(true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
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
            boxShadow:
              "0 0 16px 3px rgba(139, 92, 246, 0.7), 0 0 6px 1px rgba(217, 70, 239, 0.5)",
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
            boxShadow:
              "0 0 16px 3px rgba(139, 92, 246, 0.7), 0 0 6px 1px rgba(217, 70, 239, 0.5)",
            animation: "nav-slide 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            animationDelay: "1.05s",
          }}
        />
      </div>
    </>
  );
}

// Suspense wrapper is required because useSearchParams needs it in App Router
export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}