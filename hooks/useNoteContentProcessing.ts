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
export function useNoteContentProcessing(
  content: string | undefined,
  setNoteImages: Dispatch<SetStateAction<{ src: string; alt: string }[]>>,
  setSelectedImageIndex: Dispatch<SetStateAction<number | null>>,
) {
  useEffect(() => {
    if (!content) return;
    const imageClickHandlers = new Map<HTMLImageElement, () => void>();

    // ── Syntax highlighting ────────────────────────────────────────────────────────
    document
      .querySelectorAll<HTMLElement>("pre code:not([data-highlighted])")
      .forEach((block) => {
        hljs.highlightElement(block);
        block.setAttribute("data-highlighted", "true");
      });

    // ── KaTeX ──────────────────────────────────────────────────────────────
    document
      .querySelectorAll<HTMLElement>(
        '[data-type="inline-math"]:not([data-katex-rendered]), [data-type="block-math"]:not([data-katex-rendered])',
      )
      .forEach((el) => {
        try {
          katex.render(el.getAttribute("data-latex") || "", el, {
            displayMode: el.getAttribute("data-type") === "block-math",
            throwOnError: false,
          });
          el.setAttribute("data-katex-rendered", "true");
        } catch (err) {
          console.error("KaTeX render error:", err);
        }
      });

    // ── Heading copy buttons ───────────────────────────────────────────────
    document
      .querySelectorAll<HTMLElement>(
        ".tiptap h1, .tiptap h2, .tiptap h3, .tiptap h4, .tiptap h5, .tiptap h6",
      )
      .forEach((heading) => {
        if (heading.querySelector(".heading-copy-btn")) return;
        const btn = document.createElement("button");
        btn.className = "heading-copy-btn";
        btn.setAttribute("aria-label", "Copy link to heading");
        btn.innerHTML = LINK_ICON;
        heading.appendChild(btn);
      });

    // ── Build code block headers with copy buttons ────────────────────────
    document
      .querySelectorAll<HTMLDivElement>(".pre-wrapper")
      .forEach((wrapper) => {
        // Avoid double-injecting headers on HMR / re-runs
        wrapper.querySelector(":scope > .pre-header")?.remove();

        const codeEl = wrapper.querySelector<HTMLElement>("code");
        const preEl = wrapper.querySelector<HTMLElement>("pre");
        if (!codeEl || !preEl) return;

        const lang =
          Array.from(codeEl.classList)
            .find((c) => c.startsWith("language-"))
            ?.replace("language-", "") ?? "text";

        const header = document.createElement("header");
        header.className =
          "pre-header rounded-t-lg w-full flex items-center justify-between py-2 px-4";

        header.innerHTML = `
        <span class="text-xs font-medium text-[#b9b9b9]">${lang}</span>
        <div class="flex items-center gap-1">
          <button class="wrap-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Toggle line wrap">
            ${WRAP_ICON}
          </button>
          <button class="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Copy code">
            ${COPY_ICON}
          </button>
        </div>`;
        wrapper.insertBefore(header, wrapper.firstChild);
      });

    // ── Build table copy buttons ──────────────────────────────────────────
    document
      .querySelectorAll<HTMLElement>(".tiptap:not(.ProseMirror) table")
      .forEach((table) => {
        const wrapper = table.closest(".tableWrapper") || table.parentElement;
        if (!wrapper) return;
        if (
          wrapper.previousElementSibling?.classList.contains("table-copy-btn")
        )
          return;

        const btn = document.createElement("button");
        btn.className = "table-copy-btn";
        btn.setAttribute("aria-label", "Copy table as markdown");
        btn.innerHTML = COPY_ICON;
        wrapper.parentElement?.insertBefore(btn, wrapper);
      });

    // ── Event delegation for copy buttons ─────────────────────────────────
    const handleClick = async (e: MouseEvent) => {
      // Wrap toggle button
      const wrapBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".wrap-code-button",
      );
      if (wrapBtn) {
        const wrapper = wrapBtn.closest(".pre-wrapper");
        const preEl = wrapper?.querySelector<HTMLElement>("pre");
        if (!preEl) return;
        const isWrapped = preEl.classList.toggle("wrap-enabled");
        wrapBtn.style.opacity = isWrapped ? "0.5" : "1";
        return;
      }

      // Code copy button
      const copyBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".copy-code-button",
      );
      if (copyBtn) {
        copyBtn.disabled = true;
        const codeEl = copyBtn.closest(".pre-wrapper")?.querySelector("code");
        if (!codeEl) return;
        await navigator.clipboard.writeText(codeEl.innerText || "");
        toast.success("Copied to clipboard!");
        copyBtn.innerHTML = CHECK_ICON;
        setTimeout(() => {
          copyBtn.innerHTML = COPY_ICON;
          copyBtn.disabled = false;
        }, 3000);
        return;
      }

      // Table copy button
      const tableCopyBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".table-copy-btn",
      );
      if (tableCopyBtn) {
        tableCopyBtn.disabled = true;
        const nextEl = tableCopyBtn.nextElementSibling;
        const table =
          nextEl?.tagName === "TABLE"
            ? (nextEl as HTMLTableElement)
            : nextEl?.querySelector("table");
        if (!table) return;
        const md = htmlTableToMarkdown(table);
        await navigator.clipboard.writeText(md);
        toast.success("Table copied as markdown!");
        tableCopyBtn.innerHTML = CHECK_ICON;
        setTimeout(() => {
          tableCopyBtn.innerHTML = COPY_ICON;
          tableCopyBtn.disabled = false;
        }, 3000);
      }

      // Heading copy button
      const headingCopyBtn = (
        e.target as HTMLElement
      ).closest<HTMLButtonElement>(".heading-copy-btn");
      if (headingCopyBtn) {
        const heading = headingCopyBtn.closest<HTMLElement>(
          "h1, h2, h3, h4, h5, h6",
        );
        if (!heading?.id) return;
        const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
        return;
      }
    };

    document.addEventListener("click", handleClick);

    // ── Image lightbox ───────────────────────────────────────────────────────
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
      imageClickHandlers.forEach((h, img) =>
        img.removeEventListener("click", h),
      );
    };
  }, [content, setNoteImages, setSelectedImageIndex]);
}
