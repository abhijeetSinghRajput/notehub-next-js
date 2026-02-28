"use client";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Lock,
  Globe,
  Clock,
  Calendar,
  TextQuote,
  ChevronsUpDown,
  Inbox,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useCallback,
  useState,
  memo,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import parse from "html-react-parser";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import hljs from "highlight.js";
import { toast } from "sonner";
import katex from "katex";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useImageStore } from "@/app/stores/useImageStore";
import Footer from "@/components/Footer";
import { cn, formatDate, formatTimeAgo } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ScrollTopButton from "@/components/ScrollTopButton";
import { format } from "@/lib/utils";
import { FONT_SIZE, useEditorStore } from "@/app/stores/useEditorStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import EditorTypographyControls from "@/components/editor/EditorTypographyControls";
import SharePopover from "@/components/ShareNotePopover.client";
import BadgeIcon from "@/components/icons/BadgeIcon";
import type { INote, IUser } from "@/types/model";
import ImageLightbox from "@/components/ImageLightbox";

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

// ─── SVG icons (defined outside component — no re-creation on render) ──────────
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

// ─── Main component ────────────────────────────────────────────────────────────
const NotePageClient = () => {
  const { username, collectionSlug, noteSlug } = useParams<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>();
  const router = useRouter();
  const { authUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [noteImages, setNoteImages] = useState<{ src: string; alt: string }[]>(
    [],
  );
  const [note, setNote] = useState<INote | null>(null);
  const [author, setAuthor] = useState<IUser | null>(null);
  const { getImages } = useImageStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();
  const [progress, setProgress] = useState(0);

  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];

  // ── Derived state ────────────────────────────────────────────────────────────
  const isAuthor = useMemo(
    () => !!authUser && !!note && String(authUser._id) === String(author?._id),
    [authUser, note, author?._id],
  );

  const isAdmin = useMemo(
    () => authUser?.role === "admin",
    [authUser?.role],
  );

  const isOwner = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const handleTocItemClick = useCallback((itemId: string) => {
    document.getElementById(itemId)?.scrollIntoView({ behavior: "smooth" });
    setTocOpen(false);
  }, []);

  const handleNavigateToEditor = useCallback(() => {
    if (note?._id) {
      router.push(`/note/${String(note._id)}/editor`);
    } else {
      toast.error("Note not loaded yet!");
    }
  }, [note?._id, router]);

  const handleCloseLightbox = useCallback(() => setSelectedImageIndex(null), []);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(
          `/note/${username}/${collectionSlug}/${noteSlug}`,
        );
        if (!cancelled) {
          setNote(response.data.note);
          setAuthor(response.data.author);
        }
      } catch (error) {
        if (cancelled) return;
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 403) {
          setIsPrivate(true);
        } else {
          console.error(error);
          toast.error("Failed to load note");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    getImages();
    fetchData();
    return () => { cancelled = true; };
  }, [username, collectionSlug, noteSlug, authUser, getImages]);

  // ── Content processing ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!note?.content) return;

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

    // Syntax highlighting
    document
      .querySelectorAll<HTMLElement>("pre code:not([data-highlighted])")
      .forEach((block) => {
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
        } catch (err) {
          console.error("KaTeX render error:", err);
        }
      });

    // Copy buttons via event delegation
    const handleCopyClick = async (e: MouseEvent) => {
      const button = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        ".copy-code-button",
      );
      if (!button) return;

      button.disabled = true;
      const codeEl = button.closest(".pre-wrapper")?.querySelector("code");
      if (!codeEl) return;

      await navigator.clipboard.writeText(codeEl.innerText || "");
      toast.success("Copied to clipboard!");
      button.innerHTML = CHECK_ICON;
      setTimeout(() => {
        button.innerHTML = COPY_ICON;
        button.disabled = false;
      }, 3000);
    };

    document
      .querySelectorAll<HTMLDivElement>(".pre-wrapper")
      .forEach((pre) => {
        if (pre.querySelector(".pre-header")) return;

        const lang =
          Array.from(pre.querySelector("code")?.classList ?? [])
            .find((c) => c.startsWith("language-"))
            ?.replace("language-", "") ?? "text";

        const header = document.createElement("header");
        header.className =
          "pre-header rounded-t-lg w-full flex items-center justify-between py-2 px-4";
        header.innerHTML = `
          <span class="text-xs font-medium text-[#b9b9b9]">${lang}</span>
          <button class="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-accent-foreground">
            ${COPY_ICON}
          </button>`;
        pre.insertBefore(header, pre.firstChild);
      });

    document.addEventListener("click", handleCopyClick);

    // Image lightbox
    const contentImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(".tiptap img"),
    );
    setNoteImages(
      contentImages
        .filter((img) => Boolean(img.getAttribute("src")))
        .map((img) => ({
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "Note image",
        })),
    );

    contentImages.forEach((img, index) => {
      img.style.cursor = "zoom-in";
      const handler = () => setSelectedImageIndex(index);
      img.addEventListener("click", handler);
      imageClickHandlers.set(img, handler);
    });

    return () => {
      document.removeEventListener("click", handleCopyClick);
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
          if (item.element.getBoundingClientRect().top <= 120) {
            current = item.id;
          } else break;
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
  if (isLoading) return <NoteSkeleton />;

  if (isPrivate) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="bg-secondary p-6 rounded-full">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">This note is private</h2>
        <p className="text-muted-foreground max-w-md text-center">
          The owner of this note has set it to private. You need permission to view it.
        </p>
        <Button onClick={() => router.push(authUser ? "/" : "/login")}>
          {authUser ? "Browse your notes" : "Sign in to view your notes"}
        </Button>
      </div>
    );
  }

  if (!note?.content.trim()) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        {isOwner && (
          <Button
            onClick={handleNavigateToEditor}
            variant="secondary"
            size="lg"
            className="shadow-md font-bold"
          >
            <Pencil /> Write
          </Button>
        )}
        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
          <Inbox />
        </div>
        <div>No content</div>
      </div>
    );
  }

  return (
    <>
      {/* Image lightbox — portal-style, outside layout flow */}
      {selectedImageIndex !== null && noteImages.length > 0 && (
        <ImageLightbox
          slides={noteImages}
          index={selectedImageIndex}
          onClose={handleCloseLightbox}
        />
      )}

      <div className={cn("h-full flex flex-col justify-between")}>
        <div className="max-w-3xl w-full mx-auto relative">
          {/* ── Note header ──────────────────────────────────────────────── */}
          <div className="py-8 px-4 space-y-6 border-b border-dashed mb-6 sm:mb-12">
            <div className="flex items-center justify-between">
              <Link
                href={`/${author?.userName}`}
                className="flex flex-row items-center w-max gap-3"
              >
                <Avatar className="size-12 bg-muted">
                  <AvatarImage
                    className="w-full h-full object-cover m-0!"
                    src={author?.avatar}
                    alt={author?.fullName || "Author"}
                  />
                  <AvatarFallback>
                    {(author?.fullName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="font-semibold flex gap-4 text-primary! items-center text-sm">
                    <div className="flex gap-2 items-center">
                      <span>{author?.fullName}</span>
                      {author?.role === "admin" && (
                        <BadgeIcon className="size-4 text-blue-500" />
                      )}
                    </div>
                    {isOwner && (
                      <Badge
                        variant="ghost"
                        className="p-1 border-none text-muted-foreground"
                      >
                        {note.visibility === "public" ? (
                          <Globe size={16} strokeWidth={3} />
                        ) : (
                          <Lock
                            size={16}
                            strokeWidth={3}
                            className="size-4! fill-destructive/20 stroke-destructive"
                          />
                        )}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    @{author?.userName}
                  </span>
                </div>
              </Link>

              {isOwner && (
                <Button
                  tooltip="Edit Content"
                  onClick={() => router.push(`/note/${note?._id}/editor`)}
                  variant="secondary"
                  size="lg"
                  className="rounded-full w-10 p-0 sm:w-auto sm:px-6 border bg-muted"
                >
                  <Pencil />
                  <span className="hidden sm:inline-block">Edit</span>
                </Button>
              )}
            </div>

            <div className="flex justify-around gap-8">
              <DateMeta
                icon={<Calendar className="size-4 text-muted-foreground" />}
                label="Created"
                value={
                  note?.createdAt
                    ? format(new Date(note.createdAt), "MMM d, yyyy")
                    : ""
                }
                title={note?.createdAt ? formatDate(String(note.createdAt)) : ""}
              />
              <DateMeta
                icon={<Clock className="size-4 text-muted-foreground" />}
                label="Last Modified"
                value={
                  note?.contentUpdatedAt
                    ? formatTimeAgo(new Date(note.contentUpdatedAt), "MMM d, yyyy")
                    : ""
                }
                title={
                  note?.contentUpdatedAt
                    ? formatDate(String(note.contentUpdatedAt))
                    : ""
                }
              />
            </div>
          </div>

          {/* ── Note content ─────────────────────────────────────────────── */}
          <div
            className="tiptap"
            style={{
              fontSize: fontSize.size,
              fontFamily: editorFontFamily,
              lineHeight: "1.7",
            }}
          >
            {parse(note?.content || "")}
          </div>

          {/* ── Floating actions ─────────────────────────────────────────── */}
          <FloatingActionButtons
            toc={toc}
            tocOpen={tocOpen}
            setTocOpen={setTocOpen}
            progress={progress}
            activeId={activeId}
            handleTocItemClick={handleTocItemClick}
            note={note}
            username={username}
            collectionSlug={collectionSlug}
            noteSlug={noteSlug}
            isOwner={isOwner}
            handleNavigateToEditor={handleNavigateToEditor}
          />
        </div>

        <MemoScrollTopButton />
        <MemoFooter className="pb-28" />
      </div>
    </>
  );
};

// ─── DateMeta helper ───────────────────────────────────────────────────────────
const DateMeta = memo(
  ({
    icon,
    label,
    value,
    title,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    title: string;
  }) => (
    <div className="flex gap-1 flex-col md:gap-4 md:flex-row items-center">
      <div className="flex gap-2 items-center">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className="text-sm font-medium" title={title}>
        {value}
      </span>
    </div>
  ),
);
DateMeta.displayName = "DateMeta";

// ─── Floating action buttons ───────────────────────────────────────────────────
type FloatingActionButtonsProps = {
  toc: TocItem[];
  tocOpen: boolean;
  setTocOpen: React.Dispatch<React.SetStateAction<boolean>>;
  progress: number;
  activeId: string | null;
  handleTocItemClick: (id: string) => void;
  note: INote | null;
  username: string;
  collectionSlug: string;
  noteSlug: string;
  isOwner: boolean;
  handleNavigateToEditor: () => void;
};

const FloatingActionButtons = memo<FloatingActionButtonsProps>(
  ({
    toc,
    tocOpen,
    setTocOpen,
    progress,
    activeId,
    handleTocItemClick,
    note,
    username,
    collectionSlug,
    noteSlug,
    isOwner,
    handleNavigateToEditor,
  }) => (
    <div className="flex gap-2 items-center fixed bottom-4 right-4">
      {toc.length > 1 && (
        <Popover open={tocOpen} onOpenChange={setTocOpen}>
          <PopoverTrigger asChild>
            <Button
              className="hover:bg-primary h-11 gap-4 rounded-full py-1.5 px-2 pl-4"
              variant="default"
            >
              <div className="flex items-center gap-2">
                <TextQuote />
                Index <ChevronsUpDown className="text-primary-foreground" />
              </div>
              <div className="bg-muted/5 p-2 py-1.5 rounded-full min-w-12.5">
                {progress}%
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            alignOffset={-50}
            className="rounded-2xl min-w-max pr-1"
          >
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
      <MemoSharePopover
        shareLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${noteSlug}`}
      />
      {isOwner && (
        <Button
          onClick={handleNavigateToEditor}
          size="icon"
          tooltip="Edit Content"
          className="size-11 rounded-full"
          aria-label="Edit content"
        >
          <Pencil />
        </Button>
      )}
    </div>
  ),
);
FloatingActionButtons.displayName = "FloatingActionButtons";

export default NotePageClient;