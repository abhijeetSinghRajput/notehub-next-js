// hooks/useNoteInteractions.ts
//
// Attaches delegated event listeners to the note content container so that
// server-injected buttons (copy, wrap, heading link, table copy, image
// lightbox) actually work after hydration.
//
// Usage in NoteLayout:
//   const containerRef = useNoteInteractions({ noteImages, setSelectedImageIndex });
//   <div ref={containerRef} dangerouslySetInnerHTML={{ __html: note.content }} />

"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseNoteInteractionsOptions {
  noteImages: { src: string; alt: string }[];
  setSelectedImageIndex: (index: number | null) => void;
}

export function useNoteInteractions({
  noteImages,
  setSelectedImageIndex,
}: UseNoteInteractionsOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Copy helper ────────────────────────────────────────────────────────────
  const flashCopied = useCallback((btn: HTMLElement) => {
    const prev = btn.innerHTML;
    btn.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.style.color = "var(--color-text-success, #22c55e)";
    setTimeout(() => {
      btn.innerHTML = prev;
      btn.style.color = "";
    }, 1500);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Copy code ────────────────────────────────────────────────────────────
    function handleCopyCode(btn: HTMLElement) {
      const pre = btn.closest(".pre-wrapper")?.querySelector("pre");
      if (!pre) return;
      const text = pre.innerText ?? pre.textContent ?? "";
      navigator.clipboard.writeText(text).then(() => flashCopied(btn));
    }

    // ── Wrap / unwrap code ───────────────────────────────────────────────────
    function handleWrapCode(btn: HTMLElement) {
      const pre = btn.closest(".pre-wrapper")?.querySelector("pre");
      if (!pre) return;
      const isWrapped = pre.style.whiteSpace === "pre-wrap";
      pre.style.whiteSpace = isWrapped ? "" : "pre-wrap";
      pre.style.overflowX = isWrapped ? "" : "hidden";
      btn.style.color = isWrapped ? "" : "var(--color-text-info, #3b82f6)";
      btn.setAttribute("aria-pressed", String(!isWrapped));
    }

    // ── Heading copy-link ────────────────────────────────────────────────────
    function handleHeadingCopy(btn: HTMLElement) {
      const heading = btn.closest("h1, h2, h3, h4, h5, h6") as HTMLElement | null;
      if (!heading?.id) return;
      const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
      navigator.clipboard.writeText(url).then(() => flashCopied(btn));
    }

    // ── Table copy-as-markdown ───────────────────────────────────────────────
    function handleTableCopy(btn: HTMLElement) {
      // The button sits immediately before .tableWrapper in the DOM
      const wrapper =
        btn.nextElementSibling?.classList.contains("tableWrapper")
          ? (btn.nextElementSibling as HTMLElement)
          : btn.closest(".tableWrapper") as HTMLElement | null;

      const table = wrapper?.querySelector("table");
      if (!table) return;

      const rows = Array.from(table.querySelectorAll("tr"));
      const md = rows
        .map((row) => {
          const cells = Array.from(row.querySelectorAll("th, td")).map((c) =>
            (c as HTMLElement).innerText.trim().replace(/\|/g, "\\|")
          );
          return `| ${cells.join(" | ")} |`;
        })
        .reduce((acc, row, i, arr) => {
          // Insert separator after header row
          if (i === 1) {
            const sep = row.replace(/[^|]/g, "-");
            return acc + "\n" + sep + "\n" + row;
          }
          return acc + "\n" + row;
        });

      navigator.clipboard.writeText(md).then(() => flashCopied(btn));
    }

    // ── Image lightbox ───────────────────────────────────────────────────────
    function handleImageClick(img: HTMLElement) {
      const src = img.getAttribute("src");
      if (!src) return;
      const idx = noteImages.findIndex((im) => im.src === src);
      if (idx !== -1) setSelectedImageIndex(idx);
    }

    // ── Delegated listener ───────────────────────────────────────────────────
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      const copyBtn = target.closest<HTMLElement>(".copy-code-button");
      if (copyBtn) { handleCopyCode(copyBtn); return; }

      const wrapBtn = target.closest<HTMLElement>(".wrap-code-button");
      if (wrapBtn) { handleWrapCode(wrapBtn); return; }

      const headingBtn = target.closest<HTMLElement>(".heading-copy-btn");
      if (headingBtn) { handleHeadingCopy(headingBtn); return; }

      const tableBtn = target.closest<HTMLElement>(".table-copy-btn");
      if (tableBtn) { handleTableCopy(tableBtn); return; }

      const img = target.closest<HTMLElement>("img");
      if (img && noteImages.length > 0) { handleImageClick(img); return; }
    }

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [noteImages, setSelectedImageIndex, flashCopied]);

  return containerRef;
}