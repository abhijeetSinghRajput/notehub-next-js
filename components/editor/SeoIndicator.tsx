"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { useImageStore } from "@/app/stores/useImageStore";
import { useDraftStore } from "@/app/stores/useDraftStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useSEOChecker, SEOInputData } from "@/hooks/useSEOChecker";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FileDropZone from "../FileDropZone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Activity,
  Check,
  Settings,
  HelpCircle,
  Type,
  Link,
  AlignLeft,
  Share2,
  X as XIcon,
} from "lucide-react";

// Severity configs for diagnostics panel
const SEVERITY_CONFIG = {
  error: { Icon: XCircle, color: "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50" },
  warning: { Icon: AlertTriangle, color: "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50" },
  info: { Icon: Info, color: "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/50" },
  pass: { Icon: CheckCircle2, color: "text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/50" },
};

const GROUP_ICONS = {
  "Title": Type,
  "Meta Description": AlignLeft,
  "Slug / URL": Link,
  "Content": FileText,
  "Images": ImageIcon,
  "Social (OG)": Share2,
  "Social (Twitter)": Share2,
  "Technical": Settings,
} as Record<string, React.ComponentType<any>>;

const SEVERITY_ORDER = {
  error: 0,
  warning: 1, // issue
  info: 2,
  pass: 3, // checks
} as Record<string, number>;

interface SeoIndicatorProps {
  noteId: string;
}

export function SeoIndicator({ noteId }: SeoIndicatorProps) {
  const { editor } = useCurrentEditor();
  const { updateNote } = useNoteStore();
  const { galleryImages, getImages } = useImageStore();
  const { drafts, setDraft } = useDraftStore();
  const { authUser } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("fields");
  const [isSaving, setIsSaving] = useState(false);

  // Read note cache & draft reactively
  const note = useNoteStore((state) => state.noteCache[noteId]?.data);
  const draft = useDraftStore((state) => {
    const userId = authUser?._id;
    if (!userId) return null;
    return state.drafts[userId]?.[noteId] || null;
  });

  const activeNote = draft || note;

  // Reactively fetch images on mount/open
  useEffect(() => {
    if (open) {
      getImages().catch(console.error);
    }
  }, [open, getImages]);

  // Form states
  const [seoSlug, setSeoSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");  // pending chip text
  const [seoImageUrl, setSeoImageUrl] = useState("");
  const [seoImageAlt, setSeoImageAlt] = useState("");

  // ProseMirror document traversal to extract images reactively with zero-overhead
  const editorImages = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return [];
      const imgs: { src: string; alt: string; title: string }[] = [];
      e.state.doc.descendants((node) => {
        if (node.type.name === "image") {
          imgs.push({
            src: node.attrs.src || "",
            alt: node.attrs.alt || "",
            title: node.attrs.title || "",
          });
        }
      });
      return imgs;
    },
  });

  // Keep a stable ref to editorImages so the sync effect can read them
  // without re-running every time the editor content changes.
  const editorImagesRef = useRef(editorImages);
  useEffect(() => {
    editorImagesRef.current = editorImages;
  }, [editorImages]);

  // Track which noteId the form has been seeded for.
  // We only re-seed from the DB when the noteId changes (not on every open/close).
  // This means closing and reopening the sheet keeps the user's typed values.
  const initializedForNoteRef = useRef<string | null>(null);

  useEffect(() => {
    // Only seed when the active note changes (i.e. a different note is loaded)
    if (!activeNote || initializedForNoteRef.current === noteId) return;

    setSeoSlug(activeNote.seo?.slug || "");
    setSeoTitle(activeNote.seo?.title || "");
    setSeoDescription(activeNote.seo?.description || "");
    setSeoKeywords(Array.isArray(activeNote.seo?.keywords) ? [...activeNote.seo.keywords] : []);
    setKeywordInput("");

    const dbUrl = activeNote.seo?.image?.url || "";
    const dbAlt = activeNote.seo?.image?.alt || "";

    if (dbUrl) {
      setSeoImageUrl(dbUrl);
      setSeoImageAlt(dbAlt);
    } else {
      const imgs = editorImagesRef.current;
      if (imgs && imgs.length > 0) {
        setSeoImageUrl(imgs[0].src);
        setSeoImageAlt(imgs[0].alt || "");
      } else {
        setSeoImageUrl("");
        setSeoImageAlt("");
      }
    }

    initializedForNoteRef.current = noteId;
  }, [noteId, activeNote]);  // open/close does NOT trigger a re-seed via ref

  // Editor content HTML reactively
  const editorContent = useEditorState({
    editor,
    selector: ({ editor: e }) => e?.getHTML() || "",
  });

  // Compile SEO data input object
  const seoInputData = useMemo<SEOInputData>(() => {
    const contentStr = editorContent || "";
    const fallbackText = contentStr
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const firstPara = fallbackText.slice(0, 160);

    return {
      title: seoTitle || activeNote?.name || "",
      description: seoDescription || firstPara || "",
      slug: seoSlug || activeNote?.slug || "",
      content: contentStr,
      keywords: seoKeywords,
      images: editorImages || [],
      canonicalUrl: typeof window !== "undefined"
        ? `${window.location.origin}/${authUser?.userName || "user"}/${seoSlug || activeNote?.slug || ""}`
        : "",
      ogTitle: seoTitle || activeNote?.name || "",
      ogDescription: seoDescription || firstPara || "",
      twitterTitle: seoTitle || activeNote?.name || "",
      twitterDescription: seoDescription || firstPara || "",
      author: authUser?.fullName || "",
      publishDate: activeNote?.createdAt || "",
      category: "General",
      tags: seoKeywords,
      seoImageUrl,
    };
  }, [activeNote, seoSlug, seoTitle, seoDescription, seoKeywords, seoImageUrl, editorContent, editorImages, authUser]);

  // Real-time throttled analysis & score calculation
  const { score, grouped, summary } = useSEOChecker(seoInputData, 600);



  // Save handler
  const handleSaveSeo = async () => {
    if (!noteId || !activeNote) return;
    setIsSaving(true);

    const seoObject = {
      slug: seoSlug.trim().toLowerCase(),
      title: seoTitle.trim(),
      description: seoDescription.trim(),
      keywords: seoKeywords,           // already a string[]
      image: {
        url: seoImageUrl.trim(),
        alt: seoImageAlt.trim(),
      },
    };

    try {
      const isDraftNote = noteId.startsWith("draft-");
      const userId = authUser?._id;

      if (isDraftNote && userId) {
        setDraft(noteId, {
          ...activeNote,
          seo: seoObject,
        });
        toast.success("Draft SEO settings updated locally");
      } else {
        // First update server note
        await updateNote(noteId, {
          seo: seoObject,
        });

        // Also update draft to keep sync if it exists
        if (userId && drafts[userId]?.[noteId]) {
          setDraft(noteId, {
            ...activeNote,
            seo: seoObject,
          });
        }
      }
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save SEO settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-Fill all fields from editor content
  const handleAutoFill = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const doc = new DOMParser().parseFromString(html, "text/html");

    // 0. Auto-fill slug from note name if currently empty
    if (!seoSlug && activeNote?.name) {
      const generatedSlug = activeNote.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/(^-|-$)+/g, "");
      setSeoSlug(generatedSlug);
    }

    // 1. Auto-fill title with note name
    if (activeNote?.name) {
      setSeoTitle(activeNote.name);
    }

    // 2. Auto-fill description with first paragraph
    const p = doc.querySelector("p");
    if (p) {
      const text = p.textContent?.trim() || "";
      const cleaned = text.replace(/\s+/g, " ");
      setSeoDescription(cleaned.slice(0, 155));
    } else {
      // fallback to any plain text
      const plainText = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      setSeoDescription(plainText.slice(0, 155));
    }

    // 3. Auto-fill image with first image src in editor content
    const img = doc.querySelector("img");
    if (img) {
      const src = img.getAttribute("src") || "";
      setSeoImageUrl(src);
      const alt = img.getAttribute("alt") || "";
      setSeoImageAlt(alt); // Default pick alt text from extracted image
    } else {
      // Pick first uploaded gallery image if no images in editor
      if (galleryImages.length > 0) {
        setSeoImageUrl(galleryImages[0].url);
        setSeoImageAlt("");
      }
    }

    toast.success("Auto-filled SEO fields from content");
  };

  if (!editor || !activeNote) return null;

  // Score colors & classes
  const ringColor = score >= 90 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-rose-500";
  const textColor = score >= 90 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";

  // Custom gauge tracks & fills matching the screenshot
  const trackStroke = score >= 90
    ? "rgba(16, 185, 129, 0.15)"
    : score >= 50
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)";

  const gaugeFill = score >= 90
    ? "rgba(16, 185, 129, 0.08)"
    : score >= 50
      ? "rgba(245, 158, 11, 0.08)"
      : "rgba(239, 68, 68, 0.08)";

  return (
    <>
      {/* Floating circular progress SVG trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-40 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-md border shadow-2xl cursor-pointer transition-all duration-300 hover:scale-108 active:scale-95 group hover:border-muted-foreground/30"
        style={{ width: "60px", height: "60px" }}
        title={`SEO Score: ${score}/100`}
      >
        <svg className="lh-gauge absolute inset-0 size-full" viewBox="0 0 120 120">
          <circle
            className="lh-gauge-base transition-colors duration-500"
            r="56"
            cx="60"
            cy="60"
            strokeWidth="8"
            style={{ stroke: trackStroke, fill: gaugeFill }}
          />
          <circle
            className={cn("fill-none transition-all duration-700 ease-out", ringColor)}
            r="56"
            cx="60"
            cy="60"
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              transform: "rotate(-87.9537deg)",
              transformOrigin: "60px 60px",
              strokeDasharray: `${(score / 100) * 351.858}, 351.858`,
            }}
          />
        </svg>

        <div className="flex flex-col items-center justify-center z-10 select-none">
          <span className={cn("text-base font-extrabold leading-none tracking-tight", textColor)}>
            {score}
          </span>
          <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-widest leading-none mt-0.5">
            SEO
          </span>
        </div>
      </button>

      {/* Sheet panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-sidebar w-full sm:max-w-md md:max-w-lg h-full flex flex-col p-0 border-l shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b shrink-0">
            <div className="flex items-center gap-4">
              {/* Score SVG Gauge in place of Globe Icon */}
              <div className="relative flex items-center justify-center shrink-0 select-none" style={{ width: "48px", height: "48px" }}>
                <svg className="lh-gauge absolute inset-0 size-full" viewBox="0 0 120 120">
                  <circle
                    className="lh-gauge-base transition-colors duration-500"
                    r="56"
                    cx="60"
                    cy="60"
                    strokeWidth="8"
                    style={{ stroke: trackStroke, fill: gaugeFill }}
                  />
                  <circle
                    className={cn("fill-none transition-all duration-700 ease-out", ringColor)}
                    r="56"
                    cx="60"
                    cy="60"
                    strokeWidth="8"
                    strokeLinecap="round"
                    style={{
                      transform: "rotate(-87.9537deg)",
                      transformOrigin: "60px 60px",
                      strokeDasharray: `${(score / 100) * 351.858}, 351.858`,
                    }}
                  />
                </svg>
                <span className={cn("text-xs font-black z-10", textColor)}>
                  {score}
                </span>
              </div>

              {/* Title & Chips in place of description */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <SheetTitle className="text-base font-bold tracking-tight leading-none text-foreground">SEO Optimizer</SheetTitle>

                {/* Quick Summary Pill Row in place of description */}
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 className="size-3" /> {summary.passed} Passed
                  </span>
                  {summary.errors > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                      <XCircle className="size-3" /> {summary.errors} Errors
                    </span>
                  )}
                  {summary.warnings > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                      <AlertTriangle className="size-3" /> {summary.warnings} Warnings
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList variant="line" className="p-0 grid w-full grid-cols-2">
                <TabsTrigger value="fields" className="text-xs font-semibold gap-1.5 py-2 data-[state=active]:!bg-sidebar-accent rounded-none">
                  <Settings className="size-3.5" /> Meta Fields
                </TabsTrigger>
                <TabsTrigger value="diagnostics" className="text-xs font-semibold gap-1.5 py-2 data-[state=active]:!bg-sidebar-accent rounded-none">
                  <Activity className="size-3.5" /> SEO Audit
                </TabsTrigger>
              </TabsList>

            {/* TAB 1: SEO Meta Fields Configuration */}
            <TabsContent value="fields" className="flex-1 overflow-y-auto space-y-5 m-0 p-4">
              <div className="flex items-center justify-between pb-1 border-b">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="size-4 text-primary" /> Meta Tags Setup
                </h3>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleAutoFill}
                  className="text-xs h-7 gap-1 font-semibold hover:bg-primary/5 hover:text-primary transition-colors border-dashed"
                >
                  <Sparkles className="size-3" /> Auto-Fill Content
                </Button>
              </div>

              {/* Slug Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="seo-slug" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    SEO Custom URL Slug
                  </Label>
                  <span className={cn(
                    "text-[10px] font-semibold",
                    seoSlug.length >= 3 && seoSlug.length <= 75 ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {seoSlug.length}/75 chars
                  </span>
                </div>
                <Input
                  id="seo-slug"
                  value={seoSlug}
                  onChange={(e) => setSeoSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                  placeholder={activeNote?.slug || "enter-custom-seo-slug..."}
                  maxLength={75}
                  className="h-10 text-sm font-semibold"
                />
                <p className="text-[10px] text-muted-foreground">
                  Overrides standard URL routing for better SEO. Formatted automatically to lowercase with hyphens.
                </p>
              </div>

              {/* Title Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="seo-title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    SEO Meta Title
                  </Label>
                  <span className={cn(
                    "text-[10px] font-semibold",
                    seoTitle.length >= 50 && seoTitle.length <= 60 ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {seoTitle.length}/60 chars
                  </span>
                </div>
                <Input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={activeNote?.name || "Enter descriptive SEO title..."}
                  maxLength={70}
                  className="h-10 text-sm font-medium"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="seo-desc" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Meta Description
                  </Label>
                  <span className={cn(
                    "text-[10px] font-semibold",
                    seoDescription.length >= 120 && seoDescription.length <= 155 ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {seoDescription.length}/155 chars
                  </span>
                </div>
                <Textarea
                  id="seo-desc"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Summarize your blog post to captivate users in search lists..."
                  maxLength={170}
                  rows={3}
                  className="text-sm font-medium resize-none p-3"
                />
              </div>

              {/* Keywords Chip Input */}
              <div className="space-y-1.5">
                <Label htmlFor="seo-keywords-input" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Focus Keywords
                </Label>

                {/* Chips display */}
                {seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {seoKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                      >
                        {kw}
                        <button
                          type="button"
                          aria-label={`Remove keyword ${kw}`}
                          onClick={() => setSeoKeywords((prev) => prev.filter((k) => k !== kw))}
                          className="hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <XIcon className="size-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Keyword text input — press Enter or comma to add */}
                <Input
                  id="seo-keywords-input"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const trimmed = keywordInput.trim().replace(/,+$/, "");
                      if (trimmed && !seoKeywords.includes(trimmed)) {
                        setSeoKeywords((prev) => [...prev, trimmed]);
                      }
                      setKeywordInput("");
                    } else if (e.key === "Backspace" && keywordInput === "" && seoKeywords.length > 0) {
                      setSeoKeywords((prev) => prev.slice(0, -1));
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    // Split by comma, semicolon or newline
                    const tokens = pasted
                      .split(/[,;\n]+/)
                      .map((t) => t.trim())
                      .filter(Boolean);
                    if (tokens.length > 1 || (tokens.length === 1 && pasted.includes(","))) {
                      e.preventDefault();
                      setSeoKeywords((prev) => {
                        const existing = new Set(prev);
                        const newOnes = tokens.filter((t) => !existing.has(t));
                        return [...prev, ...newOnes];
                      });
                      setKeywordInput("");
                    }
                    // Single word without comma — let it paste normally into the input
                  }}
                  onBlur={() => {
                    // Commit on blur
                    const trimmed = keywordInput.trim().replace(/,+$/, "");
                    if (trimmed && !seoKeywords.includes(trimmed)) {
                      setSeoKeywords((prev) => [...prev, trimmed]);
                      setKeywordInput("");
                    }
                  }}
                  placeholder={seoKeywords.length === 0 ? "Type a keyword and press Enter or comma" : "Add another keyword..."}
                  className="h-10 text-sm font-medium"
                />
                <p className="text-[10px] text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono bg-muted">Enter</kbd> or <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono bg-muted">,</kbd> to add &nbsp;·&nbsp; <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono bg-muted">⌫</kbd> to remove last
                </p>
              </div>

              {/* Featured SEO Image Fields */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="size-4 text-primary" /> Feature Image & Alt
                </h4>

                {/* Preview Selected Image */}
                {seoImageUrl ? (
                  <div className="relative border rounded-lg overflow-hidden bg-muted/20 aspect-[1200/630] flex flex-col justify-end">
                    <img src={seoImageUrl} alt="SEO Preview" className="absolute inset-0 size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="relative p-3 flex justify-between items-center text-white z-10">
                      <span className="text-[10px] font-bold bg-primary/95 text-primary-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                        Active SEO Cover
                      </span>
                      <Button
                        variant="destructive"
                        size="icon"
                        type="button"
                        onClick={() => setSeoImageUrl("")}
                        className="size-6 rounded-full cursor-pointer"
                        title="Remove image"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/10 text-muted-foreground">
                    <ImageIcon className="size-8 mb-2 text-muted-foreground/60" />
                    <span className="text-xs font-semibold">No Featured Image Selected</span>
                    <span className="text-[10px] mt-0.5">Select from your upload gallery or upload a new one.</span>
                  </div>
                )}

                {/* Alt text field for image accessibility */}
                {seoImageUrl && (
                  <div className="space-y-1">
                    <Label htmlFor="seo-image-alt" className="text-[11px] font-semibold text-muted-foreground">
                      Image Alt Text (Accessibility)
                    </Label>
                    <Input
                      id="seo-image-alt"
                      value={seoImageAlt}
                      onChange={(e) => setSeoImageAlt(e.target.value)}
                      placeholder="Write rich alt description for screen readers..."
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                )}



                {/* Upload New Image option (Nest FileDropZone inside sheet) */}
                <div className="space-y-1.5 pt-1 border-t">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    Upload New Image to Gallery
                  </span>
                  <FileDropZone onImageSelect={(url) => {
                    setSeoImageUrl(url);
                    toast.success("Uploaded cover image and selected");
                  }} />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: SEO Diagnostics Audit Panel */}
            <TabsContent value="diagnostics" className="flex-1 overflow-y-auto space-y-4 m-0">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 px-4 py-2 border-b text-foreground">
                <Activity className="size-4 text-primary" /> Live SEO Audit Logs
              </h3>

              <Accordion type="multiple" className="w-full">
                {Object.entries(grouped).map(([group, checks]) => {
                  const groupErrors = checks.filter((c) => !c.pass && c.severity === "error").length;
                  const groupWarnings = checks.filter((c) => !c.pass && c.severity === "warning").length;
                  const GroupIconComponent = GROUP_ICONS[group] || FileText;

                  return (
                    <AccordionItem key={group} value={group} className="border-b border-border">
                      <AccordionTrigger className="rounded-none w-full flex items-center justify-between gap-2 py-3 px-4 hover:bg-sidebar-accent hover:no-underline cursor-pointer transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <span className="size-6 bg-muted rounded-md flex items-center justify-center border text-muted-foreground select-none shrink-0">
                            <GroupIconComponent className="size-3.5" />
                          </span>
                          <span className="text-xs font-bold text-foreground">{group}</span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto mr-2">
                          {groupErrors > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                              {groupErrors}E
                            </span>
                          )}
                          {groupWarnings > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                              {groupWarnings}W
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="p-0">
                        {[...checks]
                          .sort((a, b) => {
                            const severityA = a.pass ? "pass" : a.severity;
                            const severityB = b.pass ? "pass" : b.severity;
                            return (SEVERITY_ORDER[severityA] ?? 99) - (SEVERITY_ORDER[severityB] ?? 99);
                          })
                          .map((check) => {
                            const cfg = check.pass ? SEVERITY_CONFIG.pass : SEVERITY_CONFIG[check.severity];
                            return (
                              <div key={check.id} className="flex gap-3 py-3 pl-8 pr-4 transition-colors border-t border-border/40">
                                <cfg.Icon className={cn("size-4", cfg.color)} />
                                <div className="space-y-1 select-text text-left flex-1">
                                  <h4 className="text-xs font-bold text-foreground leading-tight">
                                    {check.label}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground leading-snug">
                                    {check.message}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>
          </Tabs>

          {/* Footer controls */}
          <SheetFooter className="p-6 border-t bg-muted/10 flex flex-row gap-2 shrink-0">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 cursor-pointer font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveSeo}
              disabled={isSaving}
              className="flex-1 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save SEO Details"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet >
    </>
  );
}
