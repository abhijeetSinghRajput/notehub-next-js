"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import Head from "next/head";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useImageStore } from "@/app/stores/useImageStore";
import { FONT_SIZE, useEditorStore } from "@/app/stores/useEditorStore";
import type { INote, IUser } from "@/types/model";

import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import PrivateNote from "@/components/note/PrivateNote";
import EmptyNoteContent from "@/components/note/EmptyNoteContent";
import NoteLayout from "@/components/note/NoteLayout";

import { useNoteContentProcessing } from "@/hooks/useNoteContentProcessing";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useTocTracking } from "@/hooks/useTocTracking";

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

  const [tocOpen, setTocOpen] = useState(false);
  const { editorFontFamily, editorFontSizeIndex } = useEditorStore();

  const fontSize = FONT_SIZE[editorFontSizeIndex] ?? FONT_SIZE[1];
  const toc = note?.tableOfContent ?? [];

  // ── Shared hooks ─────────────────────────────────────────────────────────────
  const progress = useScrollProgress();
  const activeId = useTocTracking(toc);
  useNoteContentProcessing(note?.content, setNoteImages, setSelectedImageIndex);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isAuthor = useMemo(
    () => !!authUser && !!note && String(authUser._id) === String(author?._id),
    [authUser, note, author?._id],
  );
  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser?.role]);
  const isOwner = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const handleTocItemClick = useCallback((itemId: string) => {
    const el = document.getElementById(itemId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      document.documentElement.style.scrollBehavior = "";
    }
    history.replaceState(null, "", `#${itemId}`);
    setTocOpen(false);
  }, []);

  const handleNavigateToEditor = useCallback(() => {
    if (note?._id) router.push(`/note/${String(note._id)}/editor`);
    else toast.error("Note not loaded yet!");
  }, [note?._id, router]);

  const handleCloseLightbox = useCallback(
    () => setSelectedImageIndex(null),
    [],
  );

  const shareLink = useMemo(
    () =>
      `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${collectionSlug}/${noteSlug}`,
    [username, collectionSlug, noteSlug],
  );

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
        if (err.response?.status === 403) setIsPrivate(true);
        else {
          console.error(error);
          toast.error("Failed to load note");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    getImages();
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [username, collectionSlug, noteSlug, authUser, getImages]);

  // ADD after fetch completes, inside useEffect or after setNote:
  useEffect(() => {
    if (!note) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    // Wait for content to render
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 88;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo({ top: y });
        document.documentElement.style.scrollBehavior = "";
      }
    });

    return () => cancelAnimationFrame(id);
  }, [note]);

  // ── Render guards ────────────────────────────────────────────────────────────
  if (isLoading) return <NoteSkeleton />;
  if (isPrivate) return <PrivateNote />;
  if (!note?.content?.trim())
    return (
      <EmptyNoteContent onEdit={isOwner ? handleNavigateToEditor : undefined} />
    );

  // Structured data for Article
  const articleJsonLd =
    note && author
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: note.name,
          image: noteImages.map((img) => img.src),
          datePublished: note.createdAt,
          dateModified: note.updatedAt,
          author: [
            {
              "@type": "Person",
              name: author.fullName || author.userName,
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/${author.userName}`,
            },
          ],
        }
      : null;

  // Structured data for Breadcrumb
  const breadcrumbJsonLd =
    note && author
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: author.userName,
              item: `${process.env.NEXT_PUBLIC_BASE_URL}/${author.userName}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: collectionSlug,
              item: `${process.env.NEXT_PUBLIC_BASE_URL}/${author.userName}/${collectionSlug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: note.name,
              item: `${process.env.NEXT_PUBLIC_BASE_URL}/${author.userName}/${collectionSlug}/${note.slug}`,
            },
          ],
        }
      : null;

  return (
    <>
      <Head>
        {articleJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
          />
        )}
        {breadcrumbJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbJsonLd),
            }}
          />
        )}
      </Head>
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
    </>
  );
};

export default NotePageClient;
