"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Code2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MermaidStatus = "idle" | "rendering" | "success" | "error";
type ViewMode = "code" | "preview";

type MermaidAPI = {
  initialize: (config: {
    startOnLoad: boolean;
    theme: string;
    securityLevel: "loose";
  }) => void;
  parse: (source: string) => Promise<unknown>;
  render: (id: string, source: string) => Promise<{ svg: string }>;
};

declare global {
  interface Window {
    mermaid: MermaidAPI;
    _mermaid: MermaidAPI;
  }
}

// ─── Mermaid singleton loader ─────────────────────────────────────────────────

let mermaidReady = false;
let mermaidLoadPromise: Promise<MermaidAPI> | null = null;

export function loadMermaid(): Promise<MermaidAPI> {
  if (mermaidReady) return Promise.resolve(window._mermaid);
  if (mermaidLoadPromise) return mermaidLoadPromise;

  mermaidLoadPromise = new Promise<MermaidAPI>((resolve, reject) => {
    if (typeof window !== "undefined" && window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
      window._mermaid = window.mermaid;
      mermaidReady = true;
      resolve(window.mermaid);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.0/mermaid.min.js";
    script.onload = () => {
      window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
      window._mermaid = window.mermaid;
      mermaidReady = true;
      resolve(window.mermaid);
    };
    script.onerror = () => reject(new Error("Failed to load Mermaid"));
    document.head.appendChild(script);
  });

  return mermaidLoadPromise;
}

let renderId = 0;

// ─── sanitizeMermaidSvg ───────────────────────────────────────────────────────

export function sanitizeMermaidSvg(svg: string): string {
  const stripped = svg.replace(/<style>[\s\S]*?<\/style>/gi, "");
  return `<div class="mermaid-diagram">${stripped}</div>`;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

if (typeof document !== "undefined" && !document.getElementById("mmd-spin-style")) {
  const s = document.createElement("style");
  s.id = "mmd-spin-style";
  s.textContent = "@keyframes mmd-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}

const Spinner = () => (
  <span
    className="inline-block rounded-full border-2 border-muted border-t-primary"
    style={{ width: 18, height: 18, animation: "mmd-spin 0.7s linear infinite" }}
  />
);

// ─── MermaidBlock ─────────────────────────────────────────────────────────────

interface MermaidBlockProps {
  code: string;
  language: string; // "mermaid" | "mmd" | "mindmap"
}

const MERMAID_LANGS = new Set(["mermaid", "mmd", "mindmap"]);

export function isMermaidLang(lang: string): boolean {
  return MERMAID_LANGS.has((lang ?? "").toLowerCase());
}

export default function MermaidBlock({ code, language }: MermaidBlockProps) {
  // Default to preview for mermaid blocks
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<MermaidStatus>("idle");
  const activeIdRef = useRef(0);

  const renderDiagram = useCallback(async (source: string) => {
    const trimmed = source.trim();
    if (!trimmed) { setSvg(""); setError(""); setStatus("idle"); return; }

    const myId = ++renderId;
    activeIdRef.current = myId;
    setStatus("rendering");

    try {
      await loadMermaid();
      if (activeIdRef.current !== myId) return;

      const m = window._mermaid;
      await m.parse(trimmed);
      if (activeIdRef.current !== myId) return;

      const { svg: raw } = await m.render(`mmd-view-${myId}`, trimmed);
      if (activeIdRef.current !== myId) return;

      setSvg(sanitizeMermaidSvg(raw));
      setError("");
      setStatus("success");
    } catch (e: unknown) {
      if (activeIdRef.current !== myId) return;
      setSvg("");
      setError(e instanceof Error ? e.message : "Invalid Mermaid syntax.");
      setStatus("error");
    }
  }, []);

  // Render on mount (preview is default — render immediately)
  useEffect(() => {
    renderDiagram(code);
  }, [code, renderDiagram]);

  const statusColor: Record<MermaidStatus, string> = {
    idle: "bg-muted-foreground",
    rendering: "bg-yellow-500",
    success: "bg-green-500",
    error: "bg-destructive",
  };

  const statusLabel: Record<MermaidStatus, string> = {
    idle: "—",
    rendering: "Rendering…",
    success: "Ready",
    error: "Error",
  };

  return (
    <div className="code-block rounded-2xl overflow-hidden my-4">
      {/* ── Header ── */}
      <header className="rounded-t-lg w-full flex items-center justify-between py-2 px-4">
        {/* Language badge */}
        <span className="text-xs font-medium text-[#b9b9b9]">{language}</span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2b2b2b] border border-[#3b3c3c] text-[#a1a1a1]">
            <span
              className={cn("inline-block rounded-full shrink-0", statusColor[status])}
              style={{ width: 6, height: 6 }}
            />
            <span className="text-[10px] leading-none">{statusLabel[status]}</span>
          </div>

          {/* View toggle: preview | code */}
          <div className="flex items-center rounded-md border border-[#3b3c3c] overflow-hidden">
            <Button
              type="button"
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="icon"
              className="size-7 rounded-none"
              onClick={() => setViewMode("preview")}
              title="Preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "code" ? "secondary" : "ghost"}
              size="icon"
              className="size-7 rounded-none border-l border-[#3b3c3c]"
              onClick={() => setViewMode("code")}
              title="Code"
            >
              <Code2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Preview pane ── */}
      {viewMode === "preview" && (
        <div className="flex justify-center items-start overflow-x-auto min-h-16 bg-muted border-t border-[#3b3c3c] p-4">
          {status === "rendering" || status === "idle" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground text-sm">
              <Spinner />
              <span>Rendering…</span>
            </div>
          ) : error ? (
            <div className="w-full bg-destructive/10 rounded-lg p-4">
              <p className="text-destructive text-xs font-semibold mb-2">⚠ Syntax Error</p>
              <pre className="text-destructive/80 text-xs whitespace-pre-wrap leading-relaxed font-mono">
                {error}
              </pre>
            </div>
          ) : svg ? (
            <div
              className="max-w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : null}
        </div>
      )}

      {/* ── Code pane ── */}
      {viewMode === "code" && (
        <pre className="p-4 overflow-x-auto bg-[#09090b] m-0 text-sm leading-relaxed">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      )}
    </div>
  );
}