// lib/note/processNoteContent.ts
//
// ⚠️  SERVER ONLY — never import this in a "use client" file.
//
// Transforms raw note HTML before it reaches the client:
//   • Syntax highlighting  (highlight.js)
//   • KaTeX math rendering
//   • Code block headers   (language label + copy / wrap buttons)
//   • Heading copy-link buttons
//   • Table copy-as-markdown buttons
//
// Usage in page.tsx (server component):
//   const { note, author } = await res.json();
//   note.content = await processNoteContent(note.content);
//   return <NotePageClient initialNote={note} ... />;

import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Root, RootContent, ElementContent } from "hast";
import hljs from "highlight.js";
import katex from "katex";

// ── SVG icons (same strings used by the client event handlers) ──────────────
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const WRAP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><path d="M3 12h15a3 3 0 1 1 0 6h-4"/><polyline points="16 16 14 18 16 20"/><line x1="3" y1="18" x2="10" y2="18"/></svg>`;
const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

// Helper: create a raw HTML node (rehype-stringify passes it through as-is)
const raw = (value: string): RootContent =>
  ({ type: "raw", value } as unknown as RootContent);

// ── Plugin 1: syntax highlighting ───────────────────────────────────────────
function rehypeHighlight() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "code") return;
      if (parent?.type !== "element" || parent.tagName !== "pre") return;
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
        console.error("KaTeX server render error:", err);
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

      // Skip if header already injected
      if (
        node.children.some(
          (c) =>
            c.type === "element" &&
            ((c as Element).properties?.className as string[])?.includes(
              "pre-header",
            ),
        )
      )
        return;

      // Detect language from the nested <code> element
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

      // Prepend header inside the wrapper
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
      // Skip if already injected
      if (
        node.children.some(
          (c) =>
            c.type === "element" &&
            ((c as Element).properties?.className as string[])?.includes(
              "heading-copy-btn",
            ),
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
        // Insert button before every .tableWrapper
        if (el.tagName === "div" && cls.includes("tableWrapper")) {
          next.push(
            raw(
              `<button class="table-copy-btn" aria-label="Copy table as markdown">${COPY_ICON}</button>`
            ) as unknown as ElementContent
          );
        }
        next.push(child);
      }
      node.children = next as unknown as Element["children"];
    });
  };
}

// ── Plugin 6: Image optimization ─────────────────────────────────
// - add loading="lazy"
// - add srcset

function rehypeOptimizeImages() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src as string;
      if (!src) return;

      // Optimize URL
      if (src.includes("res.cloudinary.com") && !src.includes("f_auto")) {
        node.properties.src = src.replace(
          "/upload/",
          "/upload/f_auto,q_auto,w_800/"
        );
      }

      // Add lazy loading to all images
      node.properties.loading = "lazy";
      node.properties.decoding = "async";

      // Add srcset for Cloudinary images
      const optimizedSrc = node.properties.src as string;
      if (optimizedSrc.includes("res.cloudinary.com")) {
        const srcset = [320, 640, 800]
          .map((w) => `${optimizedSrc.replace(/w_\d+/, `w_${w}`)} ${w}w`)
          .join(", ");

        node.properties.srcset = srcset;
        node.properties.sizes =
          "(max-width: 768px) 100vw, 800px";
      }
    });
  };
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function processNoteContent(html: string): Promise<string> {
  if (!html?.trim()) return html;

  const file = await unified()
    .use(rehypeParse, { fragment: true }) // parse as fragment — no wrapping <html><body>
    .use(rehypeHighlight)
    .use(rehypeKatex)
    .use(rehypeCodeHeaders)
    .use(rehypeHeadingButtons)
    .use(rehypeTableButtons)
    .use(rehypeOptimizeImages)
    .use(rehypeStringify, { allowDangerousHtml: true }) // needed so raw() nodes pass through
    .process(html);

  return String(file);
}