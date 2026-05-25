// lib/note/htmlToMarkdown.client.ts
//
// 🌐 CLIENT ONLY — uses browser DOMParser (no Node.js / cheerio required).
//
// Converts a note's HTML content into clean, readable Markdown.
// Mirrors the logic of backend/utils/htmlToMarkdown.js so behaviour
// is consistent between the "Copy MD" button and the LLM txt feed.

export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  function processNode(node: Node): string {
    // Plain text
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const children = () =>
      Array.from(el.childNodes).map(processNode).join("");

    // ── Headings ───────────────────────────────────────────────────────────
    const headingMatch = tag.match(/^h([1-6])$/);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      const text = el.textContent?.trim() ?? "";
      return `\n\n${"#".repeat(level)} ${text}\n\n`;
    }

    // ── Bold ───────────────────────────────────────────────────────────────
    if (tag === "strong" || tag === "b") {
      return `**${el.textContent?.trim()}**`;
    }

    // ── Italic ─────────────────────────────────────────────────────────────
    if (tag === "em" || tag === "i") {
      return `*${el.textContent?.trim()}*`;
    }

    // ── Code blocks ────────────────────────────────────────────────────────
    if (tag === "pre") {
      const codeEl = el.querySelector("code");
      const code = (codeEl ?? el).textContent ?? "";
      const cls =
        codeEl?.getAttribute("class") ?? el.getAttribute("class") ?? "";
      const langMatch = cls.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : "";
      return `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    }

    // ── Inline code ────────────────────────────────────────────────────────
    if (tag === "code") {
      if (el.closest("pre")) return el.textContent ?? "";
      return `\`${el.textContent}\``;
    }

    // ── Unordered list ─────────────────────────────────────────────────────
    if (tag === "ul") {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li) => `* ${li.textContent?.trim()}`)
        .join("\n");
      return `\n\n${items}\n\n`;
    }

    // ── Ordered list ───────────────────────────────────────────────────────
    if (tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li, i) => `${i + 1}. ${li.textContent?.trim()}`)
        .join("\n");
      return `\n\n${items}\n\n`;
    }

    // ── Blockquote ─────────────────────────────────────────────────────────
    if (tag === "blockquote") {
      const lines = (el.textContent?.trim() ?? "")
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      return `\n\n${lines}\n\n`;
    }

    // ── Links ──────────────────────────────────────────────────────────────
    if (tag === "a") {
      const href = el.getAttribute("href") ?? "";
      const text = el.textContent?.trim() ?? "";
      return href ? `[${text}](${href})` : text;
    }

    // ── Paragraphs ─────────────────────────────────────────────────────────
    if (tag === "p") {
      const inner = children().trim();
      return inner ? `\n\n${inner}\n\n` : "";
    }

    // ── Line break ─────────────────────────────────────────────────────────
    if (tag === "br") return "\n";

    // ── Tables ─────────────────────────────────────────────────────────────
    if (tag === "table") {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (!rows.length) return "";
      const lines: string[] = [];
      rows.forEach((row, i) => {
        const cells = Array.from(row.querySelectorAll("th, td")).map(
          (cell) => cell.textContent?.trim() ?? ""
        );
        lines.push(`| ${cells.join(" | ")} |`);
        if (i === 0) {
          lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
        }
      });
      return `\n\n${lines.join("\n")}\n\n`;
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (tag === "hr") return "\n\n---\n\n";

    // ── Skip injected UI chrome (code headers, buttons, etc.) ─────────────
    if (["script", "style", "header", "button", "svg"].includes(tag)) {
      return "";
    }

    // ── Default: recurse into children ─────────────────────────────────────
    return children();
  }

  let md = processNode(body);

  // Collapse 3+ consecutive newlines → 2
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}
