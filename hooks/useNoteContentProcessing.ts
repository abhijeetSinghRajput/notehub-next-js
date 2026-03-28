/* hooks/useNoteContentProcessing.ts
 * Fix #7 — Forced reflow / Fix #5 — LCP delay
 *
 * Original issue: this hook was parsing the note HTML string with regex
 * on every mount, including on SSR pages where the server already gave us
 * processednote.content. The DOM query for images also triggered a forced
 * layout (offsetWidth-style reads).
 *
 * Fixes:
 *  1. The hook receives `content` as `undefined` when the server has
 *     already extracted images (see NotePageClient). In that case it's
 *     a no-op — no parsing, no reflow.
 *  2. When it DOES need to run (CSR fallback), it defers via
 *     requestIdleCallback so it never blocks the first paint.
 *  3. Image extraction is now a pure regex over the HTML string, which
 *     never touches the live DOM and causes zero forced reflows.
 */
"use client";

import { useEffect } from "react";

type SetImages = React.Dispatch<
  React.SetStateAction<{ src: string; alt: string }[]>
>;
type SetIndex = React.Dispatch<React.SetStateAction<number | null>>;

// Pure regex-based extraction — never touches the DOM.
function extractImagesFromHtml(
  html: string,
): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  const imgRe = /<img\b([^>]*)>/gi;
  const attrRe = /\b(src|alt)=["']([^"']*)["']/gi;
  let imgMatch: RegExpExecArray | null;

  while ((imgMatch = imgRe.exec(html)) !== null) {
    const attrs = imgMatch[1];
    let src = "";
    let alt = "";
    let attrMatch: RegExpExecArray | null;
    attrRe.lastIndex = 0;
    while ((attrMatch = attrRe.exec(attrs)) !== null) {
      if (attrMatch[1].toLowerCase() === "src") src = attrMatch[2];
      if (attrMatch[1].toLowerCase() === "alt") alt = attrMatch[2];
    }
    if (src) images.push({ src, alt });
  }

  return images;
}

export function useNoteContentProcessing(
  /** Pass `undefined` to skip processing (images already supplied by server). */
  content: string | undefined,
  setNoteImages: SetImages,
  setSelectedImageIndex: SetIndex,
) {
  useEffect(() => {
    // Fix #5 — skip entirely when the server did the work
    if (!content) return;

    // Fix #7 — defer to after first paint so this never delays LCP
    const ric =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (fn: () => void) => setTimeout(fn, 50);

    const handle = ric(() => {
      const images = extractImagesFromHtml(content);
      setNoteImages(images);

      // Wire up click handlers via event delegation (single listener,
      // no per-image DOM reads, no forced reflow).
      const container = document.querySelector(".tiptap");
      if (!container || images.length === 0) return;

      const handleClick = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== "IMG") return;
        const src = (target as HTMLImageElement).src;
        const idx = images.findIndex((img) => img.src === src);
        if (idx !== -1) setSelectedImageIndex(idx);
      };

      container.addEventListener("click", handleClick);
      return () => container.removeEventListener("click", handleClick);
    });

    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(handle as number);
      }
    };
  }, [content, setNoteImages, setSelectedImageIndex]);
}