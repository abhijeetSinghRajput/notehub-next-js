"use client";
import { Button } from "@/components/ui/button";
import { useNoteStore } from "@/app/stores/useNoteStore";
import {
  Calendar,
  Check,
  ChevronsUpDown,
  Clock,
  Copy,
  Globe,
  Inbox,
  Lock,
  Pencil,
  TextQuote,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import parse from "html-react-parser";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import hljs from "highlight.js";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import katex from "katex";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import ShareNotePopover from "@/components/ShareNotePopover.client";

import BadgeIcon from "@/components/icons/BadgeIcon";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { INote } from "@/types/model";

type TocItem = {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
};

const NotePage = () => {
  const params = useParams();
  const noteId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { authUser } = useAuthStore();
  const { getNoteContent, status, noteNotFound, collections } = useNoteStore();
  const [content, setContent] = useState<string>("");
  const [note, setNote] = useState<INote | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();
  const fontSize = FONT_SIZE[editorFontSizeIndex] || FONT_SIZE[1];
  const [progress, setProgress] = useState(0);

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

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (noteId) {
        const fetchedNote = await getNoteContent(noteId);

        setNote(fetchedNote ?? null);
        setContent(fetchedNote?.content ?? "");
      }
    };

    fetchData();
  }, [noteId, getNoteContent]);

  useEffect(() => {
    if (content) {
      // Generate Table of Contents
      const headings = Array.from(
        document.querySelectorAll(".tiptap h1, .tiptap h2, .tiptap h3"),
      );

      const tocData = headings.map((h, index) => {
        if (!h.id) h.id = `heading-${index}`;
        return {
          id: h.id,
          text: (h as HTMLElement).innerText,
          level: Number(h.tagName[1]),
          element: h,
        };
      });
      // Fix: Ensure 'element' is typed as HTMLElement, matching TocItem
      setToc(tocData as TocItem[]);

      // Apply syntax highlighting
      document
        .querySelectorAll("pre code:not([data-highlighted])")
        .forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });

      // Render KaTeX
      document
        .querySelectorAll('[data-type="inline-math"], [data-type="block-math"]')
        .forEach((element) => {
          try {
            const latex = element.getAttribute("data-latex");
            if (!latex) return;

            const isBlock = element.getAttribute("data-type") === "block-math";
            katex.render(latex, element as HTMLElement, {
              displayMode: isBlock, // true for block, false for inline
              throwOnError: false,
            });
          } catch (error) {
            console.error("KaTeX render error:", error);
          }
        });

      // Add header with copy button to each pre tag
      document.querySelectorAll<HTMLElement>(".pre-wrapper").forEach((pre) => {
        if (!pre.querySelector(".pre-header")) {
          const codeElement = pre.querySelector("code") as HTMLElement | null;
          if (!codeElement) return;

          const languageClass = Array.from(codeElement.classList).find((cls) =>
            cls.startsWith("language-"),
          );
          const language = languageClass
            ? languageClass.replace("language-", "")
            : "unknown";

          const header = document.createElement("header");
          header.className =
            "pre-header rounded-t-lg w-full flex items-center justify-between py-2 px-4";
          header.innerHTML = `<span className="text-xs font-medium text-[#b9b9b9]">${language}</span>`;
          pre.insertBefore(header, pre.firstChild);

          const buttonContainer = document.createElement("div");
          header.appendChild(buttonContainer);

          const CopyButton = () => {
            const [copied, setCopied] = useState(false);

            const handleCopy = async () => {
              const codeContent = codeElement.innerText;
              await navigator.clipboard.writeText(codeContent);
              toast.success("Content copied to clipboard!");
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            };

            return (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                disabled={copied}
                className="gap-2 size-7"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            );
          };

          const root = createRoot(buttonContainer);
          root.render(<CopyButton />);
        }
      });

      // Add image click handlers
      const images = [
        ...document.querySelectorAll<HTMLImageElement>(".tiptap img"),
      ];
      images.forEach((img) => {
        img.style.cursor = "pointer";
        img.addEventListener("click", () => setSelectedImage(img.src));
      });

      return () => {
        images.forEach((img) => {
          img.removeEventListener("click", () => setSelectedImage(img.src));
        });
      };
    }
  }, [content]);

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

  if (!note) return null;

  const generateSharableLink = () => {
    const collection = collections.find((c) => c._id === note.collectionId);
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${authUser?.userName}/${collection?.slug}/${note?.slug}`;
  };

  if (status.noteContent.state === "loading") {
    return <NoteSkeleton />;
  }

  if (content === "") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
        <Button
          onClick={() => router.push(`/note/${noteId}/editor`)}
          variant="secondary"
          size="lg"
          className="shadow-md bottom-2 right-4 font-bold"
        >
          <Pencil /> Write
        </Button>
        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
          <Inbox />
        </div>
        <div>No content</div>
      </div>
    );
  }

  if (noteNotFound) {
    return (
      <div className="w-full h-full flex mt-40 justify-center">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="size-20 bg-muted rounded-full flex items-center justify-center">
            <Inbox className="size-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Note Note Found</h3>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full flex flex-col justify-between",
        !content.trim() && "empty",
      )}
    >
      <div className="max-w-3xl w-full mx-auto relative">
        <div className="py-8 px-4 space-y-6 border-b border-dashed mb-6 sm:mb-12">
          <div className="flex items-center justify-between">
            <Link
              href={`/${authUser?.userName}`}
              className="flex flex-row items-center w-max gap-3"
            >
              <Avatar className="size-12 bg-muted">
                <AvatarImage
                  className="w-full h-full object-cover m-0!"
                  src={authUser?.avatar}
                  alt={authUser?.fullName || "Author Profile Photo"}
                />
                <AvatarFallback>
                  {(authUser?.fullName || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="font-semibold flex gap-2 text-primary! items-center text-sm">
                  <div className="flex gap-2 items-center">
                    <span>{authUser?.fullName}</span>
                    <span>
                      {authUser?.role === "admin" && (
                        <BadgeIcon className="size-4 text-blue-500" />
                      )}
                    </span>
                  </div>
                  <Badge
                    variant="ghost"
                    className={"p-1 border-none text-muted-foreground"}
                  >
                    {note.visibility === "public" ? (
                      <Globe size={16} strokeWidth={3} />
                    ) : (
                      <Lock
                        size={16}
                        strokeWidth={3}
                        className="fill-destructive/20 stroke-destructive"
                      />
                    )}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {`@${authUser?.userName}`}
                </span>
              </div>
            </Link>
            <Button
              onClick={() => router.push(`/note/${note?._id}/editor`)}
              variant="secondary"
              size="lg"
              className="rounded-full px-6 border bg-muted"
            >
              <Pencil />
              <span>Edit</span>
            </Button>
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
                  title={formatDate(note?.createdAt.toISOString())}
                >
                  {format(new Date(note?.createdAt), "MMM d, yyyy")}
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
                  title={formatDate(note?.contentUpdatedAt.toISOString())}
                >
                  {formatTimeAgo(
                    new Date(note?.contentUpdatedAt),
                    "MMM d, yyyy",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Dialog
          open={!!selectedImage}
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
                          onClick={() => {
                            document.getElementById(item.id)?.scrollIntoView({
                              behavior: "smooth",
                            });
                            setTocOpen(false);
                          }}
                          className={cn(
                            "cursor-pointer line-clamp-1 list-decimal text-base/6! text-muted-foreground hover:text-primary",
                            activeId === item.id &&
                              "text-primary font-semibold",
                          )}
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
          <EditorTypographyControls />
          <ShareNotePopover shareLink={generateSharableLink()} />
          <Button
            onClick={() => router.push(`/note/${note._id}/editor`)}
            size="icon"
            tooltip="Edit Content"
            className="size-11 rounded-full"
            aria-label="Edit content"
          >
            <Pencil />
          </Button>
        </div>
      </div>
      <ScrollTopButton />
      <Footer className={"pb-28"} />
    </div>
  );
};

export default NotePage;
