/* app/[username]/[collectionSlug]/[noteSlug]/NotePageClient.tsx
 * Fix #5 — LCP element render delay (3,150ms → target <600ms)
 *
 * Root causes of the original delay:
 *  1. The `useEffect` fetch ran on every mount even when `initialNote` was
 *     provided — `setIsLoading(false)` was called *after* the component
 *     re-rendered with `isLoading: true` briefly (flash of NoteSkeleton).
 *  2. `useNoteContentProcessing` was running client-side regex/DOM work on
 *     the already-processed `note.content` string, causing a forced reflow
 *     on every mount.
 *  3. TOC hash-scroll effect read `getBoundingClientRect()` inside rAF
 *     immediately, which caused a sync style recalc before paint.
 *
 * Fixes applied:
 *  - Initial `isLoading` is now false when `initialNote` is present →
 *    eliminates the skeleton flash and the LCP is the note content, not
 *    the skeleton → skeleton.
 *  - Moved image extraction to server-side (page.tsx passes noteImages).
 *    If server can't supply them, fall back to client processing but only
 *    after first paint (deferred with setTimeout(fn, 0) + rAF).
 *  - Hash-scroll waits for `requestIdleCallback` instead of rAF so it
 *    doesn't compete with the initial paint.
 */
"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { FONT_SIZE, useEditorStore } from "@/app/stores/useEditorStore";
import type { INote, IUser } from "@/types/model";

import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import PrivateNote from "@/components/note/PrivateNote";
import EmptyNoteContent from "@/components/note/EmptyNoteContent";
import NoteLayout from "@/components/note/NoteLayout";

import {
  useNoteContentProcessing,
  extractImagesFromHtml,
} from "@/hooks/useNoteContentProcessing";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useTocTracking } from "@/hooks/useTocTracking";
import { processNoteContentClient } from "@/lib/note/processNoteContentClient";
import NProgress from "nprogress";

import type { FC } from "react";
import { IRelatedNote } from "@/components/note/RelatedNotes";

interface NotePageClientProps {
  initialNote: INote | null;
  initialAuthor: IUser | null;
  /**
   * Fix #5 — Pass pre-extracted image list from the server so the client
   * doesn't have to parse the HTML string after hydration.
   */
  initialImages?: { src: string; alt: string }[];
}

const NotePageClient: FC<NotePageClientProps> = ({
  initialNote,
  initialAuthor,
  initialImages = [],
}) => {
  const { username, collectionSlug, noteSlug } = useParams<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>();
  const router = useRouter();
  const { authUser } = useAuthStore();
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();

  // Fix #5 — Don't flash skeleton when SSR gave us initialNote
  const [isLoading, setIsLoading] = useState(
    initialNote === null && initialImages.length === 0 ? true : false,
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [noteImages, setNoteImages] =
    useState<{ src: string; alt: string }[]>(initialImages);
  const [note, setNote] = useState<INote | null>(initialNote ?? null);
  const [author, setAuthor] = useState<IUser | null>(initialAuthor ?? null);
  const [relatedNotes, setRelatedNotes] = useState<IRelatedNote[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Sync state with props when they change (e.g. after router.refresh())
  useEffect(() => {
    if (initialNote) {
      setNote(initialNote);
      setAuthor(initialAuthor);
      setNoteImages(initialImages);
    }
  }, [initialNote, initialAuthor, initialImages]);

  // Track whether the client processed the content itself (CSR path).
  // When true, useNoteContentProcessing becomes a no-op (images already set).
  const [clientProcessed, setClientProcessed] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];
  const toc = note?.tableOfContent ?? [];

  const progress = useScrollProgress();
  const activeId = useTocTracking(toc);

  // Only run client-side image extraction when:
  //  • The server didn't supply initialImages (SSR fallback), AND
  //  • The CSR path didn't already process the content itself.
  useNoteContentProcessing(
    initialImages.length === 0 && !clientProcessed ? note?.content : undefined,
    setNoteImages,
    setSelectedImageIndex,
  );

  const isAuthor = useMemo(
    () => !!authUser && !!author && String(authUser._id) === String(author._id),
    [authUser, author],
  );
  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser?.role]);
  const isOwner = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);

  // handleTocItemClick
  const handleTocItemClick = useCallback((itemId: string) => {
    document
      .getElementById(itemId)
      ?.scrollIntoView({ behavior: "instant", block: "start" });
    window.history.replaceState(null, "", `#${itemId}`);
    setTocOpen(false);
  }, []);

  const handleNavigateToEditor = useCallback(() => {
    if (note?._id) {
      NProgress.start();
      router.push(`/note/${String(note._id)}/editor`);
      return;
    }
    toast.error("Note not loaded yet!");
  }, [note?._id, router]);

  const handleCloseLightbox = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const shareLink = useMemo(
    () =>
      `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${note?.slug || noteSlug}`,
    [username, collectionSlug, noteSlug, note?.slug],
  );

  // Fetch only when SSR did not provide note data
  useEffect(() => {
    // Fix #5 — Early exit: SSR gave us everything, don't fetch again
    if (initialNote) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsPrivate(false);

        const response = await axiosInstance.get(
          `/note/${username}/${collectionSlug}/${noteSlug}`,
          { signal: controller.signal },
        );

        // ── Process content client-side ──────────────────────────────────
        // The server-side processNoteContent runs on SSR pages, but private
        // notes always arrive here via this CSR fetch with raw HTML.
        // We run the same pipeline (hljs, KaTeX, code headers, buttons) so
        // the rendered note looks identical to an SSR-rendered one.
        const rawNote = response.data.note;
        const processedContent = await processNoteContentClient(
          rawNote.content ?? "",
        );
        const processedNote = { ...rawNote, content: processedContent };

        // Extract images from the now-processed HTML so the lightbox works.
        const extractedImages = extractImagesFromHtml(processedContent);

        if (!isMounted || controller.signal.aborted) return;

        setNote(processedNote);
        setAuthor(response.data.author);
        setNoteImages(extractedImages);
        setClientProcessed(true);
      } catch (error: any) {
        if (
          controller.signal.aborted ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        if (!isMounted) return;

        const status = error?.response?.status;
        if (status === 403) {
          setIsPrivate(true);
          setNote(null);
          setAuthor(null);
        } else {
          console.error(error);
          toast.error("Failed to load note");
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [username, collectionSlug, noteSlug, initialNote]);

  // Fix #7 — Forced reflow: defer hash-scroll to after paint + idle
  useEffect(() => {
    if (!note?.content) return;

    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const ric =
      window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 50));
    const handle = ric(() => {
      document
        .getElementById(hash)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => {
      if (window.cancelIdleCallback)
        window.cancelIdleCallback(handle as number);
    };
  }, [note?.content]);

  useEffect(() => {
    // Don't fetch until we have a note, and only for public notes
    if (!note || !author) return;

    let cancelled = false;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const res = await axiosInstance.get(
          `/note/${author.userName}/${collectionSlug}/${note.slug}/related`,
        );
        if (!cancelled) {
          setRelatedNotes(res.data.notes ?? []);
        }
      } catch {
        // related notes are non-critical — fail silently
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [note?.slug, author?.userName, collectionSlug]);

  if (isLoading) return <NoteSkeleton />;
  if (isPrivate) return <PrivateNote />;

  if (!note?.content?.trim()) {
    return (
      <EmptyNoteContent onEdit={isOwner ? handleNavigateToEditor : undefined} />
    );
  }

  return (
    <NoteLayout
      note={note}
      headerProps={{
        note,
        author: {
          userName: author?.userName,
          fullName: author?.fullName,
          avatar: author?.avatar,
          role: author?.role,
        },
        showVisibility: isOwner,
        showEdit: isOwner,
        onEdit: handleNavigateToEditor,
      }}
      fabProps={{
        toc,
        tocOpen,
        setTocOpen,
        progress,
        activeId,
        handleTocItemClick,
        shareLink,
        onEdit: isOwner ? handleNavigateToEditor : undefined,
      }}
      fontSize={fontSize}
      fontFamily={editorFontFamily}
      selectedImageIndex={selectedImageIndex}
      noteImages={noteImages}
      onCloseLightbox={handleCloseLightbox}
      relatedNotes={relatedNotes}
      relatedLoading={relatedLoading}
    />
  );
};

export default NotePageClient;
