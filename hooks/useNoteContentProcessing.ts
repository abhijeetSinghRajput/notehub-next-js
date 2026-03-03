"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import hljs from "highlight.js";
import katex from "katex";
import { toast } from "sonner";
import type { TocItem } from "@/lib/note/types";

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

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
  setToc: Dispatch<SetStateAction<TocItem[]>>,
  setNoteImages: Dispatch<SetStateAction<{ src: string; alt: string }[]>>,
  setSelectedImageIndex: Dispatch<SetStateAction<number | null>>,
) {
  useEffect(() => {
    if (!content) return;
    const imageClickHandlers = new Map<HTMLImageElement, () => void>();

    // ── TOC ────────────────────────────────────────────────────────────────
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(".tiptap h1, .tiptap h2, .tiptap h3"),
    );
    setToc(
      headings.map((h, i) => {
        if (!h.id) h.id = `heading-${i}`;
        return { id: h.id, text: h.innerText, level: Number(h.tagName[1]), element: h };
      }),
    );

    // ── Syntax highlighting ────────────────────────────────────────────────────────
    document.querySelectorAll<HTMLElement>("pre code:not([data-highlighted])").forEach((block) => {
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

    // ── Build code block headers with copy buttons ────────────────────────
    document.querySelectorAll<HTMLDivElement>(".pre-wrapper").forEach((wrapper) => {
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
        <button class="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Copy code">
          ${COPY_ICON}
        </button>`;
      wrapper.insertBefore(header, wrapper.firstChild);
    });

    // ── Event delegation for copy buttons ─────────────────────────────────
    const handleClick = async (e: MouseEvent) => {
      // Copy button
      const copyBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(".copy-code-button");
      if (!copyBtn) return;
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
      imageClickHandlers.forEach((h, img) => img.removeEventListener("click", h));
    };
  }, [content, setToc, setNoteImages, setSelectedImageIndex]);
}
