"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import hljs from "highlight.js";
import katex from "katex";
import { toast } from "sonner";

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const WRAP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><path d="M3 12h15a3 3 0 1 1 0 6h-4"/><polyline points="16 16 14 18 16 20"/><line x1="3" y1="18" x2="10" y2="18"/></svg>`;
const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

/** Convert an HTML <table> element to a GitHub-flavoured markdown table. */
function htmlTableToMarkdown(table: HTMLTableElement): string {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (!rows.length) return "";

  const matrix = rows.map((row) =>
    Array.from(row.querySelectorAll<HTMLElement>("th, td")).map((cell) => {
      // Convert <strong>/<b> to **bold** and <em>/<i> to *italic*
      const clone = cell.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("strong, b").forEach((el) => {
        el.replaceWith(`**${el.textContent}**`);
      });
      clone.querySelectorAll("em, i").forEach((el) => {
        el.replaceWith(`*${el.textContent}*`);
      });
      return (clone.textContent || "")
        .replace(/\|/g, "\\|")
        .replace(/\n/g, " ")
        .trim();
    }),
  );

  // Determine column widths for padding
  const colCount = Math.max(...matrix.map((r) => r.length));
  const colWidths = Array.from({ length: colCount }, (_, col) =>
    Math.max(...matrix.map((r) => (r[col] || "").length), 3),
  );

  const pad = (s: string, w: number) =>
    s + " ".repeat(Math.max(0, w - s.length));

  const lines: string[] = [];
  matrix.forEach((row, i) => {
    const cells = Array.from({ length: colCount }, (_, c) =>
      pad(row[c] || "", colWidths[c]),
    );
    lines.push(`| ${cells.join(" | ")} |`);
    // Insert separator after the first row (header)
    if (i === 0) {
      const sep = colWidths.map((w) => "-".repeat(w));
      lines.push(`| ${sep.join(" | ")} |`);
    }
  });

  return lines.join("\n");
}

/**
 * Processes rendered note HTML content:
 * - Builds a table of contents from headings
 * - Applies syntax highlighting (hljs)
 * - Renders KaTeX math expressions
 * - Builds code block headers with copy buttons
 * - Sets up event delegation for copy buttons
 * - Binds image lightbox click handlers
 */
// hooks/useNoteContentProcessing.ts

export function useNoteContentProcessing(
  content: string | undefined,
  setNoteImages: Dispatch<SetStateAction<{ src: string; alt: string }[]>>,
  setSelectedImageIndex: Dispatch<SetStateAction<number | null>>,
) {
  useEffect(() => {
    if (!content) return;
    const imageClickHandlers = new Map<HTMLImageElement, () => void>();

    // ✅ REMOVED: hljs highlighting — done server-side
    // ✅ REMOVED: KaTeX rendering — done server-side
    // ✅ REMOVED: heading button injection — done server-side
    // ✅ REMOVED: code header injection — done server-side
    // ✅ REMOVED: table copy button injection — done server-side

    // ── Event delegation for copy/wrap/heading/table buttons ──────────────
    const handleClick = async (e: MouseEvent) => {
      // ... (keep all your existing click handlers unchanged)
    };

    document.addEventListener("click", handleClick);

    // ── Image lightbox ─────────────────────────────────────────────────────
    const contentImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(".tiptap img"),
    );
    setNoteImages(
      contentImages
        .filter((img) => Boolean(img.getAttribute("src")))
        .map((img) => ({
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "Note image",
        })),
    );
    contentImages.forEach((img, index) => {
      img.style.cursor = "zoom-in";
      const handler = () => setSelectedImageIndex(index);
      img.addEventListener("click", handler);
      imageClickHandlers.set(img, handler);
    });

    return () => {
      document.removeEventListener("click", handleClick);
      imageClickHandlers.forEach((h, img) => img.removeEventListener("click", h));
    };
  }, [content, setNoteImages, setSelectedImageIndex]);
}
