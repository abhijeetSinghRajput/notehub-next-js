"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import hljs from "highlight.js";
import katex from "katex";
import { toast } from "sonner";
import type { TocItem } from "@/lib/note/types";
import {
  COPY_ICON,
  CHECK_ICON,
  EYE_ICON,
  CODE_ICON,
  isMermaidLang,
  getMermaidRuntime,
  prepareMermaidSvg,
} from "@/lib/note/mermaid";

/**
 * Processes rendered note HTML content:
 * - Builds a table of contents from headings
 * - Applies syntax highlighting (hljs)
 * - Renders KaTeX math expressions
 * - Builds code block headers with copy buttons
 * - Renders mermaid diagrams with preview/code toggle
 * - Sets up event delegation for copy + mermaid toggle
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
    let cancelled = false;
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

    // ── Syntax highlighting (skip mermaid — handled separately) ────────────
    document.querySelectorAll<HTMLElement>("pre code:not([data-highlighted])").forEach((block) => {
      const lang =
        Array.from(block.classList)
          .find((c) => c.startsWith("language-"))
          ?.replace("language-", "") ?? "";
      if (isMermaidLang(lang)) return;
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

    // ── Build headers + mermaid preview/code toggle ────────────────────────
    const mermaidTargets: Array<{
      wrapper: HTMLDivElement;
      preEl: HTMLElement;
      codeEl: HTMLElement;
      previewEl: HTMLDivElement;
    }> = [];

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

      if (isMermaidLang(lang)) {
        header.innerHTML = `
          <span class="text-xs font-medium text-[#b9b9b9]">${lang}</span>
          <div class="flex items-center gap-2">
            <button class="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Copy code">
              ${COPY_ICON}
            </button>
            <div class="inline-flex items-center rounded-md border border-[#3b3c3c] overflow-hidden">
              <button
                class="mermaid-view-toggle size-7 inline-flex items-center justify-center transition-colors bg-white/20 text-foreground"
                data-mode="preview"
                aria-pressed="true"
                title="Preview"
              >${EYE_ICON}</button>
              <button
                class="mermaid-view-toggle size-7 inline-flex items-center justify-center transition-colors text-muted-foreground border-l border-[#3b3c3c]"
                data-mode="code"
                aria-pressed="false"
                title="Code"
              >${CODE_ICON}</button>
            </div>
          </div>`;

        wrapper.insertBefore(header, wrapper.firstChild);

        // Hide <pre> immediately — before async render completes
        preEl.style.display = "none";

        // Insert skeleton preview pane right away so layout is stable
        let previewEl = wrapper.querySelector<HTMLDivElement>(":scope > .mermaid-preview-pane");
        if (!previewEl) {
          previewEl = document.createElement("div");
          previewEl.className =
            "mermaid-preview-pane flex justify-center items-center overflow-x-auto min-h-32 bg-white border-t border-[#3b3c3c] p-4";
          previewEl.innerHTML = `
            <div class="flex flex-col items-center gap-3 py-8 text-muted-foreground text-sm">
              <span class="inline-block rounded-full border-2 border-muted border-t-primary" style="width:18px;height:18px;animation:mmd-spin 0.7s linear infinite"></span>
              <span>Rendering…</span>
            </div>`;
          wrapper.appendChild(previewEl);
        }
        previewEl.style.display = "flex";

        mermaidTargets.push({ wrapper, preEl, codeEl, previewEl });
      } else {
        header.innerHTML = `
          <span class="text-xs font-medium text-[#b9b9b9]">${lang}</span>
          <button class="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Copy code">
            ${COPY_ICON}
          </button>`;
        wrapper.insertBefore(header, wrapper.firstChild);
      }
    });

    // ── Render mermaid SVGs async ────────────────────────────────────────────
    const renderMermaidPreviews = async () => {
      if (mermaidTargets.length === 0) return;
      const mermaid = await getMermaidRuntime();
      if (cancelled) return;

      for (const { previewEl, codeEl } of mermaidTargets) {
        if (cancelled) return;

        const source = (codeEl.textContent || "").trim();

        if (!source) {
          previewEl.innerHTML = `<p class="text-sm text-muted-foreground py-4">No diagram content.</p>`;
          continue;
        }

        try {
          await mermaid.parse(source);
          if (cancelled) return;

          const id = `note-mmd-${Math.random().toString(36).slice(2, 10)}`;
          const { svg } = await mermaid.render(id, source);
          if (cancelled) return;

          previewEl.innerHTML = prepareMermaidSvg(svg);
        } catch (err) {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : "Invalid Mermaid syntax";
          previewEl.innerHTML = `
            <div class="w-full rounded-lg bg-destructive/10 p-4">
              <p class="text-destructive text-xs font-semibold mb-2">⚠ Syntax Error</p>
              <pre class="text-destructive/80 text-xs whitespace-pre-wrap leading-relaxed font-mono">${message}</pre>
            </div>`;
        }
      }
    };

    void renderMermaidPreviews();

    // ── Event delegation for copy + mermaid toggle ───────────────────────────
    const handleClick = async (e: MouseEvent) => {
      // Mermaid view toggle
      const toggleBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".mermaid-view-toggle",
      );
      if (toggleBtn) {
        const wrapper = toggleBtn.closest<HTMLDivElement>(".pre-wrapper");
        if (!wrapper) return;

        const mode = toggleBtn.dataset.mode as "preview" | "code";
        const preEl = wrapper.querySelector<HTMLElement>("pre");
        const previewEl = wrapper.querySelector<HTMLElement>(".mermaid-preview-pane");

        if (preEl) preEl.style.display = mode === "code" ? "block" : "none";
        if (previewEl) previewEl.style.display = mode === "preview" ? "flex" : "none";

        wrapper.querySelectorAll<HTMLButtonElement>(".mermaid-view-toggle").forEach((btn) => {
          const active = btn.dataset.mode === mode;
          btn.setAttribute("aria-pressed", active ? "true" : "false");
          if (active) {
            btn.classList.add("bg-white/20", "text-foreground");
            btn.classList.remove("text-muted-foreground");
          } else {
            btn.classList.remove("bg-white/20", "text-foreground");
            btn.classList.add("text-muted-foreground");
          }
        });
        return;
      }

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
      cancelled = true;
      document.removeEventListener("click", handleClick);
      imageClickHandlers.forEach((h, img) => img.removeEventListener("click", h));
    };
  }, [content, setToc, setNoteImages, setSelectedImageIndex]);
}
