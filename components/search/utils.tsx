// components/search/utils.ts
import { stripLatex } from "@/lib/utils";
import { removeStopwords } from "stopword";

/**
 * Extracts highlighted text snippets around matched keywords from HTML content.
 * Returns up to `limit` React elements with <mark> highlights.
 */
export function getFirstMatchSnippets(
  html: string,
  query: string,
  radius = 60,
  limit = 3,
) {
  if (!html || !query) return [] as React.ReactNode[];

  const normalizedHtml = html
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|td|th|blockquote)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ");

  const div = document.createElement("div");
  div.innerHTML = normalizedHtml;
  const text = stripLatex(div.textContent || "");
  const lowerText = text.toLowerCase();
  const keywords = removeStopwords(query.toLowerCase().split(/\s+/));
  const snippets = [];

  for (const word of keywords) {
    if (snippets.length >= limit) break;
    const index = lowerText.indexOf(word);
    if (index === -1) continue;

    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + word.length + radius);

    snippets.push(
      <span key={word}>
        {start > 0 && "..."}
        {text.slice(start, index)}
        <mark className="bg-yellow-200 text-black">
          {text.slice(index, index + word.length)}
        </mark>
        {text.slice(index + word.length, end)}
        {end < text.length && "..."}
      </span>,
    );
  }

  return snippets;
}