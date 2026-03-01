// ─── Mermaid runtime, helpers, and SVG icon constants ─────────────────────────

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MermaidRuntime = {
  initialize: (config: {
    startOnLoad: boolean;
    theme: string;
    securityLevel: "loose";
  }) => void;
  parse: (source: string) => Promise<unknown>;
  render: (id: string, source: string) => Promise<{ svg: string }>;
};

// ─── SVG icon strings (module-level — no re-creation on render) ───────────────

export const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
export const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

// Eye icon (preview)
export const EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

// Code2 icon (code view)
export const CODE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

// ─── Mermaid singleton loader ──────────────────────────────────────────────────

let mermaidRuntimePromise: Promise<MermaidRuntime> | null = null;
let mermaidRuntimeReady = false;

export const getMermaidRuntime = async (): Promise<MermaidRuntime> => {
  if (!mermaidRuntimePromise) {
    mermaidRuntimePromise = import("mermaid").then((module) => {
      const runtime = (module.default ?? module) as MermaidRuntime;
      if (!mermaidRuntimeReady) {
        runtime.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
        mermaidRuntimeReady = true;
      }
      return runtime;
    });
  }
  return mermaidRuntimePromise;
};

const MERMAID_LANGS = new Set(["mermaid", "mmd", "mindmap"]);
export const isMermaidLang = (lang: string) => MERMAID_LANGS.has(lang.toLowerCase());

/** Strip mermaid injected styles + wrap in .mermaid-diagram for mermaid-theme.css */
export function prepareMermaidSvg(svg: string): string {
  return svg.replace(
    /(<svg\b[^>]*?)\sstyle="([^"]*)"/i,
    (_match, before, styleVal) => {
      const remaining = styleVal.replace(/max-width:[^;]+;?\s*/gi, "").trim();
      return remaining ? `${before} style="${remaining}"` : before;
    }
  );
}
