"use client";

import { useNoteStore } from "@/app/stores/useNoteStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { FONT_SIZE, useEditorStore } from "@/app/stores/useEditorStore";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { INote } from "@/types/model";

import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import NoteNotFound from "@/components/note/NoteNotFound";
import EmptyNoteContent from "@/components/note/EmptyNoteContent";
import NoteLayout from "@/components/note/NoteLayout";

import { useNoteContentProcessing } from "@/hooks/useNoteContentProcessing";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useTocTracking } from "@/hooks/useTocTracking";

import type { TocItem } from "@/lib/note/types";

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

  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();
  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];

  // ── Shared hooks ─────────────────────────────────────────────────────────────
  const progress = useScrollProgress();
  const activeId = useTocTracking(toc);
  useNoteContentProcessing(note?.content, setToc, setNoteImages, setSelectedImageIndex);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const handleTocItemClick = useCallback((itemId: string) => {
    const el = document.getElementById(itemId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setTocOpen(false);
  }, []);

  const handleNavigateToEditor = useCallback(() => {
    if (noteId) router.push(`/note/${noteId}/editor`);
  }, [noteId, router]);

  const handleCloseLightbox = useCallback(() => setSelectedImageIndex(null), []);

  const shareLink = useMemo(() => {
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

  // ── Render guards ────────────────────────────────────────────────────────────
  if (status.noteContent.state === "loading") return <NoteSkeleton />;
  if (noteNotFound) return <NoteNotFound />;
  if (!note) return null;
  if (!note.content?.trim()) return <EmptyNoteContent onEdit={handleNavigateToEditor} />;

  return (
    <NoteLayout
      note={note}
      headerProps={{
        note,
        author: {
          userName: authUser?.userName,
          fullName: authUser?.fullName,
          avatar: authUser?.avatar,
          role: authUser?.role,
        },
        showVisibility: true,
        showEdit: true,
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
        onEdit: handleNavigateToEditor,
      }}
      fontSize={fontSize}
      fontFamily={editorFontFamily}
      selectedImageIndex={selectedImageIndex}
      noteImages={noteImages}
      onCloseLightbox={handleCloseLightbox}
    />
  );
};

export default NotePage;
