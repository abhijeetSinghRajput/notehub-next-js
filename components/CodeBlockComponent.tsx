"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
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
  initialize: (config: { startOnLoad: boolean; theme: string; securityLevel: "loose" }) => void;
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
// Only ever loads for mermaid code blocks — never touches normal code blocks.

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
const isMermaidLang = (lang: string) =>
  MERMAID_LANGS.includes((lang ?? "").toLowerCase());

// ─── prepareMermaidSvg ────────────────────────────────────────────────────────

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

const Spinner = memo(() => (
  <span
    className="inline-block rounded-full border-2 border-muted border-t-primary"
    style={{ width: 18, height: 18, animation: "mmd-spin 0.7s linear infinite" }}
  />
));
Spinner.displayName = "Spinner";

// ─── MermaidPreview ───────────────────────────────────────────────────────────
// Only mounted when language === mermaid. All rendering state stays here,
// completely isolated from the typing path.

interface MermaidPreviewProps {
  codeRef: React.RefObject<HTMLPreElement | null>;
  viewMode: ViewMode;
  statusRef: React.RefObject<HTMLDivElement | null>;
}

const MermaidPreview = memo(({ codeRef, viewMode, statusRef }: MermaidPreviewProps) => {
  const [mermaidSvg, setMermaidSvg] = useState("");
  const [mermaidError, setMermaidError] = useState("");
  const [mermaidStatus, setMermaidStatus] = useState<MermaidStatus>("idle");
  const [mermaidLoaded, setMermaidLoaded] = useState(mermaidReady);

  // Observe content changes via MutationObserver instead of receiving codeText
  // as a prop. This means the PARENT never re-renders for content changes.
  const [codeText, setCodeText] = useState(() => codeRef.current?.textContent ?? "");
  useEffect(() => {
    const el = codeRef.current;
    if (!el) return;
    // Initial sync
    setCodeText(el.textContent ?? "");
    const obs = new MutationObserver(() => {
      setCodeText(el.textContent ?? "");
    });
    obs.observe(el, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [codeRef]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRenderIdRef = useRef(0);

  // Load mermaid script — skipped entirely for non-mermaid blocks
  useEffect(() => {
    if (mermaidLoaded) return;
    loadMermaid()
      .then(() => setMermaidLoaded(true))
      .catch(() => {
        setMermaidError("Failed to load Mermaid.");
        setMermaidStatus("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Cancel inflight render when user switches to code-only view
  useEffect(() => {
    if (viewMode !== "code") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    activeRenderIdRef.current = ++renderId;
    setMermaidStatus("idle");
  }, [viewMode]);

  // Debounced re-render — only fires when preview pane is visible
  useEffect(() => {
    if (!mermaidLoaded || viewMode === "code") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!codeText.trim()) {
      setMermaidSvg(""); setMermaidError(""); setMermaidStatus("idle");
      return;
    }
    setMermaidStatus("rendering");
    debounceRef.current = setTimeout(() => renderMermaid(codeText), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [mermaidLoaded, viewMode, codeText, renderMermaid]);

  // Write status into the shared ref so the header can display it
  // without any state being lifted into the parent (which would re-render editor)
  useEffect(() => {
    const el = statusRef.current;
    if (!el) return;
    const colors: Record<MermaidStatus, string> = {
      idle: "bg-muted-foreground",
      rendering: "bg-yellow-500",
      success: "bg-green-500",
      error: "bg-destructive",
    };
    const labels: Record<MermaidStatus, string> = {
      idle: "—", rendering: "Rendering…", success: "Ready", error: "Error",
    };
    el.dataset.color = colors[mermaidStatus];
    el.dataset.label = labels[mermaidStatus];
  }, [mermaidStatus, statusRef]);

  return (
    <>
      {viewMode !== "code" && (
        <div className="flex justify-center items-start overflow-x-auto min-h-32 border-t border-[#3b3c3c] bg-white">
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
            <div className="p-4 w-full" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
          ) : (
            <p className="py-8 text-sm text-muted-foreground">Start typing to see your diagram…</p>
          )}
        </div>
      )}
    </>
  );
});
MermaidPreview.displayName = "MermaidPreview";

// ─── MermaidStatusDot ─────────────────────────────────────────────────────────
// Reads status from a shared ref's data attributes via MutationObserver.
// Keeps all mermaid state out of the parent — no parent re-renders.

interface MermaidStatusDotProps {
  statusRef: React.RefObject<HTMLDivElement | null>;
}

const MermaidStatusDot = memo(({ statusRef }: MermaidStatusDotProps) => {
  const [display, setDisplay] = useState({
    color: "bg-muted-foreground",
    label: "—",
  });

  useEffect(() => {
    const el = statusRef.current;
    if (!el) return;

    const sync = () =>
      setDisplay({
        color: el.dataset.color ?? "bg-muted-foreground",
        label: el.dataset.label ?? "—",
      });

    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true });
    sync(); // initial read

    return () => obs.disconnect();
  }, [statusRef]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2b2b2b] border border-[#3b3c3c] text-[#a1a1a1]">
      <span
        className={cn("inline-block rounded-full shrink-0", display.color)}
        style={{ width: 6, height: 6 }}
      />
      <span className="text-[10px] leading-none">{display.label}</span>
    </div>
  );
});
MermaidStatusDot.displayName = "MermaidStatusDot";

// ─── LanguageSelector ─────────────────────────────────────────────────────────

interface LanguageSelectorProps {
  language: string;
  languages: string[];
  onSelect: (lang: string) => void;
}

const LanguageSelector = memo(({ language, languages, onSelect }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (lang: string) => {
      onSelect(lang);
      setOpen(false);
    },
    [onSelect]
  );

  return (
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
          <CommandInput
            placeholder="Search language…"
            className="h-9 placeholder:text-neutral-400"
            wrapperClassName="border-[#595959]"
          />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((lang) => (
                <CommandItem
                  key={lang}
                  value={lang}
                  onSelect={handleSelect}
                  style={{ color: "white" }}
                  className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white"
                >
                  {lang}
                  <Check
                    className={cn(
                      "ml-auto h-3 w-3",
                      language === lang ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
LanguageSelector.displayName = "LanguageSelector";

// ─── CopyButton ───────────────────────────────────────────────────────────────

const CopyButton = memo(({ codeRef }: { codeRef: React.RefObject<HTMLPreElement | null> }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = codeRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [codeRef]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="size-7"
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
});
CopyButton.displayName = "CopyButton";

// ─── Main Component ───────────────────────────────────────────────────────────

const CodeBlockComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  extension,
}) => {
  const language: string = node?.attrs?.language ?? "";
  // NOTE: we intentionally do NOT read node.textContent here.
  // Reading it would mean every keystroke gives this component a "new" value,
  // defeating our custom memo comparator below. MermaidPreview gets content
  // via MutationObserver on the contentDOM instead.

  // Static — computed once per session, never changes
  const languages = useMemo<string[]>(() => {
    const ll: string[] = extension.options.lowlight.listLanguages();
    return Array.from(new Set([...ll, ...MERMAID_LANGS])).sort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const codeRef = useRef<HTMLPreElement | null>(null);
  // Shared ref for status communication between MermaidPreview and MermaidStatusDot.
  // Using a ref (not state) means status changes never re-render this component.
  const mermaidStatusRef = useRef<HTMLDivElement | null>(null);

  const isMermaid = isMermaidLang(language);

  const handleLanguageSelect = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang === language ? "" : lang });
    },
    [language, updateAttributes]
  );

  const handleViewMode = useCallback((mode: ViewMode) => setViewMode(mode), []);

  // Reset view mode when switching away from mermaid
  useEffect(() => {
    if (!isMermaid) setViewMode("both");
  }, [isMermaid]);

  return (
    <NodeViewWrapper
      className={cn(
        "code-block relative rounded-2xl overflow-hidden",
        isMermaid && "is-mermaid",
        isMermaid && `mermaid-view-${viewMode}`
      )}
    >
      {/* ── Header ── */}
      <header className="rounded-t-lg w-full flex items-center justify-between py-2 px-4">
        <LanguageSelector
          language={language}
          languages={languages}
          onSelect={handleLanguageSelect}
        />

        <div className="flex items-center gap-2" contentEditable={false}>
          {isMermaid ? (
            <>
              {/* Status dot reads from mermaidStatusRef via MutationObserver */}
              <MermaidStatusDot statusRef={mermaidStatusRef} />

              {/* View toggle */}
              <div className="flex items-center rounded-md border border-[#3b3c3c] overflow-hidden">
                {(["code", "both", "preview"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-7 rounded-none",
                      mode === "both" && "border-x border-[#3b3c3c]",
                      viewMode === mode && "bg-white/20"
                    )}
                    onClick={() => handleViewMode(mode)}
                    title={
                      mode === "code"
                        ? "Code only"
                        : mode === "both"
                        ? "Code and preview"
                        : "Preview only"
                    }
                  >
                    {mode === "code" ? (
                      <Code2 className="h-3.5 w-3.5" />
                    ) : mode === "both" ? (
                      <Columns2 className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <CopyButton codeRef={codeRef} />
          )}
        </div>
      </header>

      {/* ── Code pane — kept in DOM even in preview mode (no layout thrash) ── */}
      <div
        className="bg-[#181818]"
        style={{
          display: isMermaid && viewMode === "preview" ? "none" : "block",
        }}
      >
        <pre
          ref={codeRef}
          className="p-4 overflow-x-auto m-0 bg-transparent"
          style={{
            tabSize: 4,
            whiteSpace: "pre",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            lineHeight: 1.625,
          }}
        >
          {/* @ts-ignore */}
          <NodeViewContent as="code" className={`language-${language}`} />
        </pre>
      </div>

      {/* ── Mermaid preview — ONLY mounted when language is mermaid ── */}
      {/* Hidden status target — written by MermaidPreview, read by MermaidStatusDot */}
      {isMermaid && (
        <>
          <div ref={mermaidStatusRef} style={{ display: "none" }} />
          <MermaidPreview
            codeRef={codeRef}
            viewMode={viewMode}
            statusRef={mermaidStatusRef}
          />
        </>
      )}
    </NodeViewWrapper>
  );
};

// Custom memo comparator: only re-render when the language attribute changes.
// Content changes (typing) are handled entirely by ProseMirror through its
// contentDOM — React has nothing to do with it. Without this comparator,
// memo() sees a new `node` reference on EVERY keystroke and re-renders the
// entire component tree, which is the root cause of the typing lag.
export default memo(CodeBlockComponent, (prevProps, nextProps) => {
  return prevProps.node.attrs.language === nextProps.node.attrs.language;
});