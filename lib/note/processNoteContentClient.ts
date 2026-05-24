/**
 * lib/note/processNoteContentClient.ts
 *
 * Client-side equivalent of processNoteContent.ts.
 *
 * Runs the same pipeline (highlight.js, KaTeX, code headers, heading buttons,
 * table buttons, image optimisation, heading shift) entirely in the browser.
 *
 * All packages used here are in `dependencies` (not devDependencies) and are
 * browser-safe:  unified · rehype-parse · rehype-stringify · unist-util-visit
 *                highlight.js · katex
 *
 * Usage (inside a "use client" component):
 *   import { processNoteContentClient } from "@/lib/note/processNoteContentClient";
 *   const processed = await processNoteContentClient(rawHtml);
 */

import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Root, RootContent, ElementContent } from "hast";
import hljs from "highlight.js";
import katex from "katex";

// ── SVG icons (kept identical to the server version) ────────────────────────
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const WRAP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><path d="M3 12h15a3 3 0 1 1 0 6h-4"/><polyline points="16 16 14 18 16 20"/><line x1="3" y1="18" x2="10" y2="18"/></svg>`;
const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

// Helper: create a raw HTML node (rehype-stringify passes it through as-is)
const raw = (value: string): RootContent =>
  ({ type: "raw", value } as unknown as RootContent);

// ── Plugin 1: syntax highlighting ───────────────────────────────────────────
function rehypeHighlight() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, _index, parent) => {
      if (node.tagName !== "code") return;
      if (parent?.type !== "element" || (parent as Element).tagName !== "pre") return;
      if (node.properties?.dataHighlighted === "true") return;

      const text = node.children
        .filter((c) => c.type === "text")
        .map((c) => (c as { type: "text"; value: string }).value)
        .join("");

      const classes = (node.properties?.className as string[]) ?? [];
      const langClass = classes.find((c) => c.startsWith("language-"));
      const lang = langClass?.replace("language-", "");

      let highlighted: string;
      try {
        highlighted = lang
          ? hljs.highlight(text, { language: lang, ignoreIllegals: true }).value
          : hljs.highlightAuto(text).value;
      } catch {
        highlighted = text;
      }

      node.children = [raw(highlighted)] as unknown as Element["children"];
      node.properties = {
        ...node.properties,
        dataHighlighted: "true",
        className: [...classes, "hljs"],
      };
    });
  };
}

// ── Plugin 2: KaTeX ─────────────────────────────────────────────────────────
function rehypeKatex() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const type = node.properties?.dataType as string | undefined;
      if (type !== "inline-math" && type !== "block-math") return;
      if (node.properties?.dataKatexRendered) return;

      const latex = (node.properties?.dataLatex as string) ?? "";
      try {
        const rendered = katex.renderToString(latex, {
          displayMode: type === "block-math",
          throwOnError: false,
          output: "html",
        });
        node.children = [raw(rendered)] as unknown as Element["children"];
        node.properties = { ...node.properties, dataKatexRendered: "true" };
      } catch (err) {
        console.error("KaTeX client render error:", err);
      }
    });
  };
}

// ── Plugin 3: code block headers ────────────────────────────────────────────
function rehypeCodeHeaders() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const classes = (node.properties?.className as string[]) ?? [];
      if (node.tagName !== "div" || !classes.includes("pre-wrapper")) return;

      if (
        node.children.some(
          (c) =>
            c.type === "element" &&
            ((c as Element).properties?.className as string[])?.includes("pre-header"),
        )
      )
        return;

      let lang = "text";
      visit(node, "element", (child: Element) => {
        if (child.tagName !== "code") return;
        const cc = (child.properties?.className as string[]) ?? [];
        const lc = cc.find((c) => c.startsWith("language-"));
        if (lc) lang = lc.replace("language-", "");
      });

      const headerHtml =
        `<header class="pre-header rounded-t-lg w-full flex items-center justify-between py-2 px-4">` +
        `<span class="text-xs font-medium text-[#b9b9b9]">${lang}</span>` +
        `<div class="flex items-center gap-1">` +
        `<button class="wrap-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Toggle line wrap">${WRAP_ICON}</button>` +
        `<button class="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-current" aria-label="Copy code">${COPY_ICON}</button>` +
        `</div></header>`;

      node.children = [raw(headerHtml), ...node.children] as unknown as Element["children"];
    });
  };
}

// ── Plugin 4: heading copy-link buttons ─────────────────────────────────────
function rehypeHeadingButtons() {
  return (tree: Root) => {
    const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
    visit(tree, "element", (node: Element) => {
      if (!HEADINGS.has(node.tagName)) return;
      if (
        node.children.some(
          (c) =>
            c.type === "element" &&
            ((c as Element).properties?.className as string[])?.includes("heading-copy-btn"),
        )
      )
        return;

      node.children = [
        ...node.children,
        raw(
          `<button class="heading-copy-btn" aria-label="Copy link to heading">${LINK_ICON}</button>`,
        ) as unknown as RootContent,
      ] as unknown as Element["children"];
    });
  };
}

// ── Plugin 5: table copy-as-markdown buttons ─────────────────────────────────
function rehypeTableButtons() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!node.children) return;

      const next: typeof node.children = [];
      for (const child of node.children) {
        if (child.type !== "element") {
          next.push(child);
          continue;
        }
        const el = child as Element;
        const cls = (el.properties?.className as string[]) ?? [];
        if (el.tagName === "div" && cls.includes("tableWrapper")) {
          next.push(
            raw(
              `<button class="table-copy-btn" aria-label="Copy table as markdown">${COPY_ICON}</button>`,
            ) as unknown as ElementContent,
          );
        }
        next.push(child);
      }
      node.children = next as unknown as Element["children"];
    });
  };
}

// ── Plugin 6: image optimisation ─────────────────────────────────────────────
function rehypeOptimizeImages() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src as string;
      if (!src) return;

      const lowercaseSrc = src.toLowerCase();
      const isSvg = lowercaseSrc.endsWith(".svg") || lowercaseSrc.includes(".svg") || lowercaseSrc.includes(".svg?");

      // Optimize URL only if it's not an SVG
      if (!isSvg && src.includes("res.cloudinary.com")) {
        // Strip any existing transformations (e.g. w_800, c_limit)
        const cleanSrc = src.replace(/\/upload\/(?![v\d])([^/]+)\//, "/upload/");

        // Set optimal fallback src
        node.properties.src = cleanSrc.replace(
          "/upload/",
          "/upload/f_auto,q_auto,w_1600/"
        );

        // Generate responsive high-resolution srcset
        const targetSrc = cleanSrc.replace("/upload/", "/upload/w_1600/");
        const srcset = [320, 640, 1024, 1600, 2000]
          .map((w) => `${targetSrc.replace(/w_\d+/, `w_${w}`)} ${w}w`)
          .join(", ");

        node.properties.srcset = srcset;
        node.properties.sizes = "(max-width: 1024px) 100vw, 1200px";
      }

      // Add lazy loading and decoding to all images
      node.properties.loading = "lazy";
      node.properties.decoding = "async";
    });
  };
}

// ── Plugin 7: shift headings ─────────────────────────────────────────────────
function rehypeShiftHeadings() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const map: Record<string, string> = {
        h1: "h2",
        h2: "h3",
        h3: "h4",
        h4: "h5",
        h5: "h6",
      };
      if (map[node.tagName]) {
        node.tagName = map[node.tagName];
      }
    });
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function processNoteContentClient(html: string): Promise<string> {
  if (!html?.trim()) return html;

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight)
    .use(rehypeKatex)
    .use(rehypeShiftHeadings)
    .use(rehypeCodeHeaders)
    .use(rehypeHeadingButtons)
    .use(rehypeTableButtons)
    .use(rehypeOptimizeImages)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(html);

  return String(file);
}
