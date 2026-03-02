"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Check,
  ChevronsUpDown,
  Code2,
  Columns2,
  Eye,
  Copy,
  CopyCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NodeViewContent, NodeViewWrapper, NodeViewProps } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MermaidStatus = "idle" | "rendering" | "success" | "error";
type ViewMode = "code" | "preview" | "both";

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

function loadMermaid(): Promise<MermaidAPI> {
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MERMAID_LANGS = ["mermaid", "mmd", "mindmap"];
const isMermaidLang = (lang: string) => MERMAID_LANGS.includes((lang ?? "").toLowerCase());

const CODE_LINE_HEIGHT = 1.625;

// ─── prepareMermaidSvg ────────────────────────────────────────────────────────
//
// Only removes the inline max-width style Mermaid stamps on the <svg> tag so
// it respects the container width. All other Mermaid styles are kept as-is —
// no custom theme, no CSS overrides.
//
function prepareMermaidSvg(svg: string): string {
  return svg.replace(
    /(<svg\b[^>]*?)\sstyle="([^"]*)"/i,
    (_match, before, styleVal) => {
      const remaining = styleVal.replace(/max-width:[^;]+;?\s*/gi, "").trim();
      return remaining ? `${before} style="${remaining}"` : before;
    }
  );
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

// ─── Component ────────────────────────────────────────────────────────────────

const CodeBlockComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, extension }) => {
  const defaultLanguage: string = node?.attrs?.language ?? "";
  const codeText: string = node?.textContent ?? "";

  const languages = useMemo<string[]>(() => {
    const ll: string[] = extension.options.lowlight.listLanguages();
    return Array.from(new Set([...ll, ...MERMAID_LANGS])).sort();
  }, [extension.options.lowlight]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [mermaidSvg, setMermaidSvg] = useState("");
  const [mermaidError, setMermaidError] = useState("");
  const [mermaidStatus, setMermaidStatus] = useState<MermaidStatus>("idle");
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  const codeRef = useRef<HTMLPreElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRenderIdRef = useRef(0);

  const isMermaid = isMermaidLang(language);

  // ── Sync language attr ─────────────────────────────────────────────────────
  useEffect(() => { setLanguage(defaultLanguage); }, [defaultLanguage]);

  // ── Reset on switching away from mermaid ──────────────────────────────────
  useEffect(() => {
    if (!isMermaid) {
      setViewMode("both");
      setMermaidSvg("");
      setMermaidError("");
      setMermaidStatus("idle");
    }
  }, [isMermaid]);

  // ── Cancel render when entering code-only mode ────────────────────────────
  useEffect(() => {
    if (viewMode === "code") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      activeRenderIdRef.current = ++renderId;
      setMermaidStatus("idle");
    }
  }, [viewMode]);

  // ── Lazy-load mermaid.js ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isMermaid || mermaidLoaded) return;
    loadMermaid()
      .then(() => setMermaidLoaded(true))
      .catch(() => { setMermaidError("Failed to load Mermaid."); setMermaidStatus("error"); });
  }, [isMermaid, mermaidLoaded]);

  // ── Render function ────────────────────────────────────────────────────────
  const renderMermaid = useCallback(async (source: string) => {
    if (!mermaidReady) return;

    const trimmed = source.trim();
    if (!trimmed) {
      setMermaidSvg(""); setMermaidError(""); setMermaidStatus("idle");
      return;
    }

    const myId = ++renderId;
    activeRenderIdRef.current = myId;
    setMermaidStatus("rendering");

    try {
      const m = window._mermaid;
      await m.parse(trimmed);
      if (activeRenderIdRef.current !== myId) return;

      const { svg } = await m.render(`mmd-${myId}`, trimmed);
      if (activeRenderIdRef.current !== myId) return;

      setMermaidSvg(prepareMermaidSvg(svg));
      setMermaidError("");
      setMermaidStatus("success");
    } catch (e: unknown) {
      if (activeRenderIdRef.current !== myId) return;
      setMermaidSvg("");
      setMermaidError(e instanceof Error ? e.message : "Invalid Mermaid diagram syntax.");
      setMermaidStatus("error");
    }
  }, []);

  // ── Debounced render ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMermaid || !mermaidLoaded || viewMode === "code") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!codeText.trim()) {
      setMermaidSvg(""); setMermaidError(""); setMermaidStatus("idle");
      return;
    }

    setMermaidStatus("rendering");
    debounceRef.current = setTimeout(() => renderMermaid(codeText), 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [isMermaid, mermaidLoaded, viewMode, codeText, renderMermaid]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const text = codeRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLanguageSelect = (lang: string) => {
    const next = lang === language ? "" : lang;
    setLanguage(next);
    updateAttributes({ language: next });
    setOpen(false);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const lineCount = codeText.split("\n").length;

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <NodeViewWrapper
      className={cn(
        "code-block relative rounded-2xl overflow-hidden",
        isMermaid && "is-mermaid",
        isMermaid && `mermaid-view-${viewMode}`,
      )}
    >
      {/* ── Header ── */}
      <header className="rounded-t-lg w-full flex items-center justify-between py-2 px-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="min-w-32 justify-between h-7"
              contentEditable={false}
            >
              {language || "Select language…"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-50 bg-neutral-800 border-neutral-800 p-0" align="start">
            <Command className="bg-transparent text-neutral-50 border-neutral-800">
              <CommandInput placeholder="Search language…" className="h-9 placeholder:text-neutral-400" wrapperClassName="border-[#595959]" />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {languages.map((lang) => (
                    <CommandItem
                      key={lang}
                      value={lang}
                      onSelect={handleLanguageSelect}
                      style={{ color: "white" }}
                      className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white"
                    >
                      {lang}
                      <Check className={cn("ml-auto h-3 w-3", language === lang ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2" contentEditable={false}>
          {isMermaid ? (
            <>
              {/* Status pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2b2b2b] border border-[#3b3c3c] text-[#a1a1a1]">
                <span
                  className={cn("inline-block rounded-full shrink-0", statusColor[mermaidStatus])}
                  style={{ width: 6, height: 6 }}
                />
                <span className="text-[10px] leading-none">{statusLabel[mermaidStatus]}</span>
              </div>

              {/* View toggle */}
              <div className="flex items-center rounded-md border border-[#3b3c3c] overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("size-7 rounded-none", viewMode === "code" && "bg-white/20")}
                  onClick={() => setViewMode("code")}
                  title="Code only"
                >
                  <Code2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("size-7 rounded-none border-x border-[#3b3c3c]", viewMode === "both" && "bg-white/20")}
                  onClick={() => setViewMode("both")}
                  title="Code and preview"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("size-7 rounded-none", viewMode === "preview" && "bg-white/20")}
                  onClick={() => setViewMode("preview")}
                  title="Preview only"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="size-7"
              title={copied ? "Copied!" : "Copy code"}
            >
              {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </header>

      {/* ── Code pane ── always in DOM, hidden via display:none in preview mode ── */}
      <div
        className="relative flex bg-[#181818]"
        style={{ display: isMermaid && viewMode === "preview" ? "none" : "flex" }}
      >
        {/* Line numbers */}
        <div
          aria-hidden
          className="select-none shrink-0 border-r border-white/5 text-right pt-4 pb-4"
          style={{ minWidth: 44 }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-[#a1a1a1] pr-3 pl-2"
              style={{
                fontFamily: "monospace",
                fontSize: "0.875rem",
                lineHeight: CODE_LINE_HEIGHT,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <pre
          ref={codeRef}
          className="flex-1 p-4 overflow-x-auto m-0 bg-transparent"
          style={{
            tabSize: 4,
            whiteSpace: "pre",
            fontFamily: "monospace",
            lineHeight: CODE_LINE_HEIGHT,
          }}
        >
          {/* @ts-ignore */}
          <NodeViewContent as="code" className={`language-${language}`} />
        </pre>
      </div>

      {/* ── Mermaid preview pane ── */}
      {isMermaid && (viewMode === "preview" || viewMode === "both") && (
        <div className="mermaid-preview flex justify-center items-start overflow-x-auto min-h-32 border-t border-[#3b3c3c] bg-white">
          {!mermaidLoaded || mermaidStatus === "rendering" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground text-sm">
              <Spinner />
              <span>{!mermaidLoaded ? "Loading Mermaid…" : "Rendering…"}</span>
            </div>
          ) : mermaidError ? (
            <div className="w-full p-4 bg-destructive/10">
              <pre className="text-destructive/80 text-xs whitespace-pre-wrap leading-relaxed font-mono">
                {mermaidError}
              </pre>
            </div>
          ) : mermaidSvg ? (
            <div
              className="p-4 w-full"
              dangerouslySetInnerHTML={{ __html: mermaidSvg }}
            />
          ) : (
            <p className="py-8 text-sm text-muted-foreground">
              Start typing to see your diagram…
            </p>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;