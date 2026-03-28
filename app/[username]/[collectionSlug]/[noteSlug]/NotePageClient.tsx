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
import type { FC } from "react";

interface NotePageClientProps {
  initialNote: INote | null;
  initialAuthor: IUser | null;
}

const NotePageClient: FC<NotePageClientProps> = ({
  initialNote,
  initialAuthor,
}) => {
  const { username, collectionSlug, noteSlug } = useParams<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>();
  const router = useRouter();
  const { authUser } = useAuthStore();
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();

  const [isLoading, setIsLoading] = useState(!initialNote);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [noteImages, setNoteImages] = useState<{ src: string; alt: string }[]>(
    [],
  );
  const [note, setNote] = useState<INote | null>(initialNote ?? null);
  const [author, setAuthor] = useState<IUser | null>(initialAuthor ?? null);
  const [tocOpen, setTocOpen] = useState(false);

  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];
  const toc = note?.tableOfContent ?? [];

  const progress = useScrollProgress();
  const activeId = useTocTracking(toc);
  useNoteContentProcessing(note?.content, setNoteImages, setSelectedImageIndex);

  const isAuthor = useMemo(
    () => !!authUser && !!author && String(authUser._id) === String(author._id),
    [authUser, author],
  );

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser?.role]);
  const isOwner = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);

  const handleTocItemClick = useCallback((itemId: string) => {
    const el = document.getElementById(itemId);

    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: y });
      document.documentElement.style.scrollBehavior = "";
    }

    window.history.replaceState(null, "", `#${itemId}`);
    setTocOpen(false);
  }, []);

  const handleNavigateToEditor = useCallback(() => {
    if (note?._id) {
      router.push(`/note/${String(note._id)}/editor`);
      return;
    }

    toast.error("Note not loaded yet!");
  }, [note?._id, router]);

  const handleCloseLightbox = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const shareLink = useMemo(() => {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${noteSlug}`;
  }, [username, collectionSlug, noteSlug]);

  // Fetch only when SSR did not provide note data
  useEffect(() => {
    if (initialNote) {
      setIsLoading(false);
      setIsPrivate(false);
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
          {
            signal: controller.signal,
          },
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

  // Scroll to hash after content is available/rendered
  useEffect(() => {
    if (!note?.content) return;

    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const frameId = window.requestAnimationFrame(() => {
      const el = document.getElementById(hash);

      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 88;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo({ top: y });
        document.documentElement.style.scrollBehavior = "";
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
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
