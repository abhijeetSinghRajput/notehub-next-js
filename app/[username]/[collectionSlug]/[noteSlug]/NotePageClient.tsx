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
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import parse from "html-react-parser";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import hljs from "highlight.js";
import { toast } from "sonner";
import katex from "katex";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import SharePopover from "@/components/SharePopover.client";
import BadgeIcon from "@/components/icons/BadgeIcon";
import type { INote, IUser } from "@/types/model";

const MemoEditorTypographyControls = memo(EditorTypographyControls);
const MemoSharePopover = memo(SharePopover);
const MemoScrollTopButton = memo(ScrollTopButton);
const MemoFooter = memo(Footer);

type TocItem = {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
};

const NotePageClient = () => {
  const { username, collectionSlug, noteSlug } = useParams<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>();
  const router = useRouter();
  const { authUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [note, setNote] = useState<INote | null>(null);
  const [author, setAuthor] = useState<IUser | null>(null);
  const { getImages } = useImageStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState<boolean>(false);
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();

  const [progress, setProgress] = useState<number>(0);
  const fontSize = FONT_SIZE[editorFontSizeIndex] || FONT_SIZE[1];

  // ✅ MOVED: useMemo/useCallback BEFORE any conditional returns
  const isAuthor = useMemo(() => {
    // Ensure both objects exist before comparing
    if (!authUser || !note) return false;
    return String(authUser._id) === String(author?._id);
  }, [authUser, note]);

  const isAdmin = useMemo(() => {
    if (!authUser) return false;
    return authUser.role === "admin";
  }, [authUser]);

  const isOwner = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);

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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(
          `/note/${username}/${collectionSlug}/${noteSlug}`,
        );
        const { note, author } = response.data;
        setNote(note);
        setAuthor(author);
      } catch (error) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 403) {
          setIsPrivate(true);
        } else {
          console.error(error);
          toast.error("Failed to load note");
        }
      } finally {
        setIsLoading(false);
      }
    };

    getImages();
    fetchData();
  }, [username, collectionSlug, noteSlug, authUser, getImages]);

  // Content processing
  useEffect(() => {
    if (!note?.content) return;

    const imageClickHandlers = new Map<HTMLImageElement, () => void>();

    // Generate TOC
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".tiptap h1, .tiptap h2, .tiptap h3",
      ),
    );
    const tocData: TocItem[] = headings.map((h, index) => {
      if (!h.id) h.id = `heading-${index}`;
      return {
        id: h.id,
        text: h.innerText,
        level: Number(h.tagName[1]),
        element: h,
      };
    });
    setToc(tocData);

    // Syntax highlighting
    const codeBlocks = document.querySelectorAll<HTMLElement>(
      "pre code:not([data-highlighted])",
    );
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
      block.setAttribute("data-highlighted", "true");
    });

    // KaTeX
    const mathElements = document.querySelectorAll<HTMLElement>(
      '[data-type="inline-math"]:not([data-katex-rendered]), [data-type="block-math"]:not([data-katex-rendered])',
    );
    mathElements.forEach((element) => {
      try {
        const latex = element.getAttribute("data-latex") || "";
        const isBlock = element.getAttribute("data-type") === "block-math";
        katex.render(latex, element, {
          displayMode: isBlock,
          throwOnError: false,
        });
        element.setAttribute("data-katex-rendered", "true");
      } catch (error) {
        console.error("KaTeX render error:", error);
      }
    });

    // ✅ EVENT DELEGATION - Single listener for all buttons
    const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

    const handleCopyClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>(".copy-code-button");
      if (!button) return;

      button.disabled = true;
      const pre = button.closest(".pre-wrapper");
      const codeElement = pre?.querySelector("code");
      if (!codeElement) return;

      const codeContent = codeElement.innerText || "";
      await navigator.clipboard.writeText(codeContent);
      toast.success("Content copied to clipboard!");

      button.innerHTML = checkIcon;
      setTimeout(() => {
        button.innerHTML = copyIcon;
        button.disabled = false;
      }, 3000);
    };

    // Add headers with buttons
    const preWrappers =
      document.querySelectorAll<HTMLDivElement>(".pre-wrapper");
    preWrappers.forEach((pre) => {
      if (!pre.querySelector(".pre-header")) {
        const codeElement = pre.querySelector("code");
        const languageClass = Array.from(codeElement?.classList || []).find(
          (cls) => cls.startsWith("language-"),
        );
        const language = languageClass
          ? languageClass.replace("language-", "")
          : "unknown";

        const header = document.createElement("header");
        header.className =
          "pre-header rounded-t-lg w-full flex items-center justify-between py-2 px-4";

        header.innerHTML = `
        <span className="text-xs font-medium text-[#b9b9b9]">${language}</span>
        <button className="copy-code-button gap-2 size-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-background/50 hover:text-accent-foreground">
          ${copyIcon}
        </button>
      `;

        pre.insertBefore(header, pre.firstChild);
      }
    });

    // Single delegated listener
    document.addEventListener("click", handleCopyClick);

    // Image handlers
    const images = document.querySelectorAll<HTMLImageElement>(".tiptap img");
    images.forEach((img) => {
      img.style.cursor = "pointer";
      const handler = () => setSelectedImage(img.getAttribute("src"));
      img.addEventListener("click", handler);
      imageClickHandlers.set(img, handler);
    });

    // ✅ ULTRA CLEAN CLEANUP
    return () => {
      document.removeEventListener("click", handleCopyClick);

      imageClickHandlers.forEach((handler, img) => {
        img.removeEventListener("click", handler);
      });
    };
  }, [note?.content]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = window.innerHeight;

          const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
          setProgress(Math.min(100, Math.max(0, Math.round(percent))));

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // TOC scroll tracking
  useEffect(() => {
    if (toc.length === 0) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          let current: string | null = null;
          const containerTop = 0; // body top is 0

          for (const item of toc) {
            const rect = item.element.getBoundingClientRect();
            if (rect.top - containerTop <= 120) {
              current = item.id;
            } else {
              break;
            }
          }

          setActiveId(current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Run once initially
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  if (isLoading) {
    return <NoteSkeleton />;
  }

  if (isPrivate) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="bg-secondary p-6 rounded-full">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">This note is private</h2>
        <p className="text-muted-foreground max-w-md text-center">
          The owner of this note has set it to private. You need permission to
          view it.
        </p>
        {authUser ? (
          <Button onClick={() => router.push("/")}>Browse your notes</Button>
        ) : (
          <Button onClick={() => router.push("/login")}>
            Sign in to view your notes
          </Button>
        )}
      </div>
    );
  }

  if (!note?.content.trim()) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
        {isOwner && (
          <Button
            onClick={handleNavigateToEditor}
            variant="secondary"
            size="lg"
            className="shadow-md bottom-2 right-4 font-bold"
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
    <div
      className={cn(
        "h-full flex flex-col justify-between",
        !note?.content.trim() && "empty",
      )}
    >
      <div className="max-w-3xl w-full mx-auto relative">
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
                  alt={author?.fullName || "Author Profile Photo"}
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
                      className={"p-1 border-none text-muted-foreground"}
                    >
                      {note.visibility === "public" &&
                      note.visibility === "public" ? (
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
                  {`@${author?.userName}`}
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
            {/* Created Date */}
            <div className="flex gap-1 flex-col md:gap-4 md:flex-row items-center">
              <div className="flex gap-2 items-center">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Created
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-sm font-medium"
                  title={
                    note?.createdAt ? formatDate(String(note.createdAt)) : ""
                  }
                >
                  {note?.createdAt
                    ? format(new Date(note.createdAt), "MMM d, yyyy")
                    : ""}
                </span>
              </div>
            </div>

            {/* Last Modified */}
            <div className="flex gap-1 flex-col md:gap-4 md:flex-row items-center">
              <div className="flex gap-2 items-center">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Last Modified
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-sm font-medium"
                  title={
                    note?.contentUpdatedAt
                      ? formatDate(String(note.contentUpdatedAt))
                      : ""
                  }
                >
                  {note?.contentUpdatedAt
                    ? formatTimeAgo(
                        new Date(note.contentUpdatedAt),
                        "MMM d, yyyy",
                      )
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          open={Boolean(selectedImage)}
          onOpenChange={(open) => !open && setSelectedImage(null)}
        >
          <DialogContent
            closeButtonClassName="top-2 left-2 right-auto bg-black md:size-6 flex items-center justify-center bg-neutral-200 text-neutral-600"
            className="p-0 border-none w-auto h-auto max-w-[100vw] max-h-screen overflow-hidden sm:rounded-lg"
          >
            <DialogTitle className="hidden">Image Dialog</DialogTitle>
            <div className="flex items-center justify-center w-full h-full">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="object-contain w-auto h-auto max-w-[100vw] max-h-screen"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

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

        {/* ✅ MEMOIZED FLOATING BUTTONS */}
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
      <MemoFooter className={"pb-28"} />
    </div>
  );
};

// ✅ EXTRACT FLOATING BUTTONS TO SEPARATE MEMOIZED COMPONENT
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
  }) => {
    return (
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
                  {Number(progress || 0)}%
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
                          "cursor-pointer pl-0! list-decimal text-base/6! text-muted-foreground hover:text-primary",
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
    );
  },
);

FloatingActionButtons.displayName = "FloatingActionButtons";

export default NotePageClient;
