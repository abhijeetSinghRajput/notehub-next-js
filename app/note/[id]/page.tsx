"use client";
import { Button } from "@/components/ui/button";
import { useNoteStore } from "@/app/stores/useNoteStore";
import {
  Calendar,
  ChevronsUpDown,
  Clock,
  Globe,
  Inbox,
  Lock,
  Pencil,
  TextQuote,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useCallback,
  useState,
  memo,
} from "react";
import parse from "html-react-parser";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import hljs from "highlight.js";
import { toast } from "sonner";
import katex from "katex";
import ImageLightbox from "@/components/ImageLightbox";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate, formatTimeAgo } from "@/lib/utils";
import ScrollTopButton from "@/components/ScrollTopButton";
import { Badge } from "@/components/ui/badge";
import { format } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FONT_SIZE, useEditorStore } from "@/app/stores/useEditorStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import EditorTypographyControls from "@/components/editor/EditorTypographyControls";
import SharePopover from "@/components/ShareNotePopover.client";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { INote } from "@/types/model";

// ─── Memoized heavy sub-components ────────────────────────────────────────────
const MemoEditorTypographyControls = memo(EditorTypographyControls);
const MemoSharePopover = memo(SharePopover);
const MemoScrollTopButton = memo(ScrollTopButton);
const MemoFooter = memo(Footer);

// ─── Types ─────────────────────────────────────────────────────────────────────
type TocItem = {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
};

type MermaidRuntime = {
  initialize: (config: {
    startOnLoad: boolean;
    theme: string;
    securityLevel: "loose";
  }) => void;
  parse: (source: string) => Promise<unknown>;
  render: (id: string, source: string) => Promise<{ svg: string }>;
};

// ─── SVG icon strings (module-level — no re-creation on render) ───────────────

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

// Eye icon (preview)
const EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

// Code2 icon (code view)
const CODE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

// ─── Mermaid singleton loader ──────────────────────────────────────────────────

let mermaidRuntimePromise: Promise<MermaidRuntime> | null = null;
let mermaidRuntimeReady = false;

const getMermaidRuntime = async (): Promise<MermaidRuntime> => {
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
const isMermaidLang = (lang: string) => MERMAID_LANGS.has(lang.toLowerCase());

// Strip mermaid injected styles + wrap in .mermaid-diagram for mermaid-theme.css
function prepareMermaidSvg(svg: string): string {
  return svg.replace(
    /(<svg\b[^>]*?)\sstyle="([^"]*)"/i,
    (_match, before, styleVal) => {
      const remaining = styleVal.replace(/max-width:[^;]+;?\s*/gi, "").trim();
      return remaining ? `${before} style="${remaining}"` : before;
    }
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const NotePage = () => {
  const params = useParams();
  const noteId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const { authUser } = useAuthStore();
  const { getNoteContent, status, noteNotFound, collections } = useNoteStore();
  const [note, setNote] = useState<INote | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [noteImages, setNoteImages] = useState<{ src: string; alt: string }[]>([]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();
  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];
  const [progress, setProgress] = useState(0);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const handleTocItemClick = useCallback((itemId: string) => {
    document.getElementById(itemId)?.scrollIntoView({ behavior: "smooth" });
    setTocOpen(false);
  }, []);

  const handleNavigateToEditor = useCallback(() => {
    if (noteId) router.push(`/note/${noteId}/editor`);
  }, [noteId, router]);

  const handleCloseLightbox = useCallback(() => setSelectedImageIndex(null), []);

  const generateSharableLink = useMemo(() => {
    if (!note) return "";
    const collection = collections.find((c) => c._id === note.collectionId);
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${authUser?.userName}/${collection?.slug}/${note?.slug}`;
  }, [note, collections, authUser?.userName]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (noteId) {
        const fetchedNote = await getNoteContent(noteId);
        setNote(fetchedNote ?? null);
      }
    };
    fetchData();
  }, [noteId, getNoteContent]);

  // ── Content processing ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!note?.content) return;
    let cancelled = false;
    const imageClickHandlers = new Map<HTMLImageElement, () => void>();

    // TOC
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(".tiptap h1, .tiptap h2, .tiptap h3"),
    );
    setToc(
      headings.map((h, i) => {
        if (!h.id) h.id = `heading-${i}`;
        return { id: h.id, text: h.innerText, level: Number(h.tagName[1]), element: h };
      }),
    );

    // Syntax highlighting (skip mermaid — handled separately)
    document.querySelectorAll<HTMLElement>("pre code:not([data-highlighted])").forEach((block) => {
      const lang = Array.from(block.classList).find((c) => c.startsWith("language-"))?.replace("language-", "") ?? "";
      if (isMermaidLang(lang)) return;
      hljs.highlightElement(block);
      block.setAttribute("data-highlighted", "true");
    });

    // KaTeX
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
        } catch (err) { console.error("KaTeX render error:", err); }
      });

    // ── Build headers + mermaid preview/code toggle ──────────────────────────
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
        Array.from(codeEl.classList).find((c) => c.startsWith("language-"))?.replace("language-", "") ?? "text";

      const header = document.createElement("header");
      header.className = "pre-header rounded-t-lg w-full flex items-center justify-between py-2 px-4";

      if (isMermaidLang(lang)) {
        // ── Copy + icon toggle matching editor theme ──
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
          previewEl.className = "mermaid-preview-pane flex justify-center items-center overflow-x-auto min-h-32 bg-white border-t border-[#3b3c3c] p-4";
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
        // Normal code block header
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
      const toggleBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(".mermaid-view-toggle");
      if (toggleBtn) {
        const wrapper = toggleBtn.closest<HTMLDivElement>(".pre-wrapper");
        if (!wrapper) return;

        const mode = toggleBtn.dataset.mode as "preview" | "code";
        const preEl = wrapper.querySelector<HTMLElement>("pre");
        const previewEl = wrapper.querySelector<HTMLElement>(".mermaid-preview-pane");

        if (preEl) preEl.style.display = mode === "code" ? "block" : "none";
        if (previewEl) previewEl.style.display = mode === "preview" ? "flex" : "none";

        // Update active state on buttons
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
      setTimeout(() => { copyBtn.innerHTML = COPY_ICON; copyBtn.disabled = false; }, 3000);
    };

    document.addEventListener("click", handleClick);

    // ── Image lightbox ───────────────────────────────────────────────────────
    const contentImages = Array.from(document.querySelectorAll<HTMLImageElement>(".tiptap img"));
    setNoteImages(
      contentImages
        .filter((img) => Boolean(img.getAttribute("src")))
        .map((img) => ({ src: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "Note image" })),
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
  }, [note?.content]);

  // ── Scroll progress ──────────────────────────────────────────────────────────
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const { scrollY, innerHeight } = window;
        const total = document.documentElement.scrollHeight - innerHeight;
        setProgress(total > 0 ? Math.min(100, Math.round((scrollY / total) * 100)) : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── TOC active tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (toc.length === 0) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        let current: string | null = null;
        for (const item of toc) {
          if (item.element.getBoundingClientRect().top <= 120) current = item.id;
          else break;
        }
        setActiveId(current);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  // ── Render guards ────────────────────────────────────────────────────────────
  if (status.noteContent.state === "loading") {
    return <NoteSkeleton />;
  }

  if (noteNotFound) {
    return (
      <div className="w-full h-full flex mt-40 justify-center">
        <div className="flex flex-col items-center text-center max-w-md space-y-4">
          <div className="size-20 bg-muted rounded-full flex items-center justify-center">
            <Inbox className="size-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Note Not Found</h3>
            <p className="text-muted-foreground">
              We couldn&apos;t find this note. It may have been deleted or moved.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">Explore Notes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!note) return null;

  if (!note.content?.trim()) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Button onClick={handleNavigateToEditor} variant="secondary" size="lg" className="shadow-md font-bold">
          <Pencil /> Write
        </Button>
        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
          <Inbox />
        </div>
        <div>No content</div>
      </div>
    );
  }

  return (
    <>
      {selectedImageIndex !== null && noteImages.length > 0 && (
        <ImageLightbox slides={noteImages} index={selectedImageIndex} onClose={handleCloseLightbox} />
      )}

      <div className={cn("h-full flex flex-col justify-between")}>
        <div className="max-w-3xl w-full mx-auto relative">
          {/* ── Note header ── */}
          <div className="py-8 px-4 space-y-6 border-b border-dashed mb-6 sm:mb-12">
            <div className="flex items-center justify-between">
              <Link href={`/${authUser?.userName}`} className="flex flex-row items-center w-max gap-3">
                <Avatar className="size-12 bg-muted">
                  <AvatarImage className="w-full h-full object-cover m-0!" src={authUser?.avatar} alt={authUser?.fullName || "Author"} />
                  <AvatarFallback>{(authUser?.fullName || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="font-semibold flex gap-4 text-primary! items-center text-sm">
                    <div className="flex gap-2 items-center">
                      <span>{authUser?.fullName}</span>
                      {authUser?.role === "admin" && <BadgeIcon className="size-4 text-blue-500" />}
                    </div>
                    <Badge variant="ghost" className="p-1 border-none text-muted-foreground">
                      {note.visibility === "public"
                        ? <Globe size={16} strokeWidth={3} />
                        : <Lock size={16} strokeWidth={3} className="size-4! fill-destructive/20 stroke-destructive" />}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">@{authUser?.userName}</span>
                </div>
              </Link>

              <Button
                tooltip="Edit Content"
                onClick={handleNavigateToEditor}
                variant="secondary" size="lg"
                className="rounded-full w-10 p-0 sm:w-auto sm:px-6 border bg-muted"
              >
                <Pencil /><span className="hidden sm:inline-block">Edit</span>
              </Button>
            </div>

            <div className="flex justify-around gap-8">
              <DateMeta
                icon={<Calendar className="size-4 text-muted-foreground" />}
                label="Created"
                value={note?.createdAt ? format(new Date(note.createdAt), "MMM d, yyyy") : ""}
                title={note?.createdAt ? formatDate(note.createdAt) : ""}
              />
              <DateMeta
                icon={<Clock className="size-4 text-muted-foreground" />}
                label="Last Modified"
                value={note?.contentUpdatedAt ? formatTimeAgo(new Date(note.contentUpdatedAt), "MMM d, yyyy") : ""}
                title={note?.contentUpdatedAt ? formatDate(note.contentUpdatedAt) : ""}
              />
            </div>
          </div>

          {/* ── Note title ── */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight px-4 mb-6">{note?.name || "Untitled Note"}</h1>

          {/* ── Note content ── */}
          <div className="tiptap" style={{ fontSize: fontSize.size, fontFamily: editorFontFamily, lineHeight: "1.7" }}>
            {parse(note?.content || "")}
          </div>

          {/* ── Floating actions ── */}
          <FloatingActionButtons
            toc={toc} tocOpen={tocOpen} setTocOpen={setTocOpen}
            progress={progress} activeId={activeId} handleTocItemClick={handleTocItemClick}
            shareLink={generateSharableLink}
            handleNavigateToEditor={handleNavigateToEditor}
          />
        </div>

        <MemoScrollTopButton />
        <MemoFooter className="pb-28" />
      </div>
    </>
  );
};

// ─── DateMeta ─────────────────────────────────────────────────────────────────
const DateMeta = memo(({ icon, label, value, title }: {
  icon: React.ReactNode; label: string; value: string; title: string;
}) => (
  <div className="flex gap-1 flex-col md:gap-4 md:flex-row items-center">
    <div className="flex gap-2 items-center">
      {icon}
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
    <span className="text-sm font-medium" title={title}>{value}</span>
  </div>
));
DateMeta.displayName = "DateMeta";

// ─── FloatingActionButtons ────────────────────────────────────────────────────
type FloatingActionButtonsProps = {
  toc: TocItem[];
  tocOpen: boolean;
  setTocOpen: React.Dispatch<React.SetStateAction<boolean>>;
  progress: number;
  activeId: string | null;
  handleTocItemClick: (id: string) => void;
  shareLink: string;
  handleNavigateToEditor: () => void;
};

const FloatingActionButtons = memo<FloatingActionButtonsProps>(({
  toc, tocOpen, setTocOpen, progress, activeId, handleTocItemClick,
  shareLink, handleNavigateToEditor,
}) => (
  <div className="flex gap-2 items-center fixed bottom-4 right-4">
    {toc.length > 1 && (
      <Popover open={tocOpen} onOpenChange={setTocOpen}>
        <PopoverTrigger asChild>
          <Button className="hover:bg-primary h-11 gap-4 rounded-full py-1.5 px-2 pl-4" variant="default">
            <div className="flex items-center gap-2">
              <TextQuote />
              Index <ChevronsUpDown className="text-primary-foreground" />
            </div>
            <div className="bg-muted/5 p-2 py-1.5 rounded-full min-w-12.5">{progress}%</div>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} alignOffset={-50} className="rounded-2xl min-w-max pr-1">
          <ScrollArea>
            <div className="max-w-75 sm:max-w-sm max-h-[60vh] pr-4">
              <div className="space-y-2">
                {toc.map((item) => (
                  <p
                    key={item.id}
                    onClick={() => handleTocItemClick(item.id)}
                    className={cn(
                      "cursor-pointer list-decimal text-base/6! text-muted-foreground hover:text-primary transition-colors",
                      activeId === item.id && "text-primary font-semibold",
                    )}
                    style={{ paddingLeft: (item.level - 1) * 12 }}
                  >
                    {item.text}
                  </p>
                ))}
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )}

    <MemoEditorTypographyControls />
    <MemoSharePopover shareLink={shareLink} />
    <Button onClick={handleNavigateToEditor} size="icon" tooltip="Edit Content" className="size-11 rounded-full" aria-label="Edit content">
      <Pencil />
    </Button>
  </div>
));
FloatingActionButtons.displayName = "FloatingActionButtons";

export default NotePage;
