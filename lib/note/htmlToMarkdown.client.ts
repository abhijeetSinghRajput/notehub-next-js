// lib/note/htmlToMarkdown.client.ts
//
// 🌐 CLIENT ONLY — uses browser DOMParser (no Node.js / cheerio required).
//
// Converts a note's HTML content into clean, readable Markdown.
// Mirrors the logic of backend/utils/htmlToMarkdown.js so behaviour
// is consistent between the "Copy MD" button and the LLM txt feed.
//
// Supports:
//   • LaTeX block math  →  $$...$$
//   • LaTeX inline math →  $...$
//   • Tables            →  Markdown pipe tables
//   • Images            →  ![alt](src)
//   • Code blocks       →  ```lang\n...\n```
//   • Inline code       →  `...`
//   • Headings, bold, italic, lists, blockquotes, links, HR

export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  /** Recursively convert a DOM node to Markdown text. */
  function processNode(node: Node): string {
    // ── Plain text node ──────────────────────────────────────────────────────
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    /** Process all children and join their output. */
    const children = (): string =>
      Array.from(el.childNodes).map(processNode).join("");

    // ── Skip injected UI chrome (code headers, wrap-buttons, SVGs, etc.) ────
    if (["script", "style", "header", "button", "svg"].includes(tag)) {
      return "";
    }

    // ── Block LaTeX math  [data-type="block-math"]  →  $$...$$ ──────────────
    const dataType = el.getAttribute("data-type");
    if (dataType === "block-math") {
      const latex = el.getAttribute("data-latex") ?? "";
      return `\n\n$$${latex}$$\n\n`;
    }

    // ── Inline LaTeX math  [data-type="inline-math"]  →  $...$ ──────────────
    if (dataType === "inline-math") {
      const latex = el.getAttribute("data-latex") ?? "";
      return `$${latex}$`;
    }

    // ── Headings ─────────────────────────────────────────────────────────────
    const headingMatch = tag.match(/^h([1-6])$/);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      // Use children() so inline math/bold inside headings is preserved
      const text = children().trim();
      return `\n\n${"#".repeat(level)} ${text}\n\n`;
    }

    // ── Images  →  ![alt](src) ───────────────────────────────────────────────
    if (tag === "img") {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      return src ? `\n\n![${alt}](${src})\n\n` : "";
    }

    // ── Horizontal rule ──────────────────────────────────────────────────────
    if (tag === "hr") return "\n\n---\n\n";

    // ── Bold ─────────────────────────────────────────────────────────────────
    if (tag === "strong" || tag === "b") {
      return `**${children().trim()}**`;
    }

    // ── Italic ───────────────────────────────────────────────────────────────
    if (tag === "em" || tag === "i") {
      return `*${children().trim()}*`;
    }

    // ── Tables ───────────────────────────────────────────────────────────────
    if (tag === "table") {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (!rows.length) return "";

      const lines: string[] = [];
      rows.forEach((row, i) => {
        const cells = Array.from(row.querySelectorAll("th, td")).map(
          (cell) => (cell.textContent?.trim() ?? "").replace(/\|/g, "\\|")
        );
        if (!cells.length) return;
        lines.push(`| ${cells.join(" | ")} |`);
        if (i === 0) {
          lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
        }
      });
      return lines.length ? `\n\n${lines.join("\n")}\n\n` : "";
    }

    // ── Code blocks (pre > code) ─────────────────────────────────────────────
    if (tag === "pre") {
      const codeEl = el.querySelector("code");
      const code = (codeEl ?? el).textContent ?? "";
      const cls =
        codeEl?.getAttribute("class") ?? el.getAttribute("class") ?? "";
      const langMatch = cls.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : "";
      return `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    }

    // ── Inline code ──────────────────────────────────────────────────────────
    if (tag === "code") {
      // Already handled if inside a <pre>; guard just in case
      if (el.closest("pre")) return el.textContent ?? "";
      return `\`${el.textContent}\``;
    }

    // ── Unordered list ───────────────────────────────────────────────────────
    if (tag === "ul") {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li) => `* ${li.textContent?.trim()}`)
        .join("\n");
      return `\n\n${items}\n\n`;
    }

    // ── Ordered list ─────────────────────────────────────────────────────────
    if (tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li, i) => `${i + 1}. ${li.textContent?.trim()}`)
        .join("\n");
      return `\n\n${items}\n\n`;
    }

    // ── Blockquote ───────────────────────────────────────────────────────────
    if (tag === "blockquote") {
      // Use children() so inline math inside quotes is converted
      const inner = children().trim();
      const lines = inner.split("\n").map((l) => `> ${l}`).join("\n");
      return `\n\n${lines}\n\n`;
    }

    // ── Links ────────────────────────────────────────────────────────────────
    if (tag === "a") {
      const href = el.getAttribute("href") ?? "";
      const text = el.textContent?.trim() ?? "";
      return href ? `[${text}](${href})` : text;
    }

    // ── Paragraphs ───────────────────────────────────────────────────────────
    if (tag === "p") {
      // Use children() so inline math inside paragraphs is converted
      const inner = children().trim();
      return inner ? `\n\n${inner}\n\n` : "";
    }

    // ── Line break ───────────────────────────────────────────────────────────
    if (tag === "br") return "\n";

    // ── Default: recurse into children ───────────────────────────────────────
    return children();
  }

  let md = processNode(body);

  // Collapse 3+ consecutive newlines → 2
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}
