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

import { useNoteContentProcessing } from "@/hooks/useNoteContentProcessing";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useTocTracking } from "@/hooks/useTocTracking";
import NProgress from "nprogress";

import type { FC } from "react";

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
  const [tocOpen, setTocOpen] = useState(false);

  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];
  const toc = note?.tableOfContent ?? [];

  const progress = useScrollProgress();
  const activeId = useTocTracking(toc);

  // Fix #5 — Only run client-side image processing if the server didn't
  // supply initialImages (i.e. fallback CSR path).
  useNoteContentProcessing(
    initialImages.length === 0 ? note?.content : undefined,
    setNoteImages,
    setSelectedImageIndex,
  );

  const isAuthor = useMemo(
    () => !!authUser && !!author && String(authUser._id) === String(author._id),
    [authUser, author],
  );
  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser?.role]);
  const isOwner = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);

  const handleTocItemClick = useCallback((itemId: string) => {
    const el = document.getElementById(itemId);
    if (el) {
      // Fix #7 — read getBoundingClientRect in a single rAF, not synchronously
      requestAnimationFrame(() => {
        const y = el.getBoundingClientRect().top + window.scrollY - 88;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo({ top: y });
        document.documentElement.style.scrollBehavior = "";
      });
    }
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
      `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${noteSlug}`,
    [username, collectionSlug, noteSlug],
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

        if (!isMounted || controller.signal.aborted) return;

        setNote(response.data.note);
        setAuthor(response.data.author);
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

    // Use requestIdleCallback so this never competes with the initial paint.
    // Falls back to setTimeout for Safari.
    const ric =
      window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 50));
    const handle = ric(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 88;
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo({ top: y });
          document.documentElement.style.scrollBehavior = "";
        }
      });
    });

    return () => {
      if (window.cancelIdleCallback)
        window.cancelIdleCallback(handle as number);
    };
  }, [note?.content]);

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
    />
  );
};

export default NotePageClient;
