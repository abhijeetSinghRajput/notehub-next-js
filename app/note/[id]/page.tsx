/**
 * app/note/[id]/page.tsx — DEPRECATED viewer, now a redirect shim.
 *
 * /note/:id is no longer the canonical note URL.
 * The single source of truth is /:username/:collectionSlug/:noteSlug.
 *
 * This page resolves the note ID → canonical URL and redirects.
 * The editor at /note/:id/editor is NOT affected by this file.
 */
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import NoteNotFound from "@/components/note/NoteNotFound";

const NoteRedirectPage = () => {
  const params = useParams();
  const noteId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const { collections, getNoteContent, noteNotFound } = useNoteStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!noteId) return;

    const resolve = async () => {
      // ── Step 1: Resolve from the already-loaded sidebar collections ──────
      // The collections store is already populated for authenticated users.
      // The note's parent collection has the correct slug; the owner username
      // comes from authUser (these are always the current user's collections).
      if (authUser?.userName && collections.length > 0) {
        for (const collection of collections) {
          const found = collection.notes?.find((n) => String(n._id) === noteId);
          if (found) {
            router.replace(
              `/${authUser.userName}/${collection.slug}/${found.seo?.slug || found.slug}`
            );
            return;
          }
        }
      }

      // ── Step 2: Fetch from the server ─────────────────────────────────────
      // The API populates note.userId (→ IUser) and note.collectionId (→ ICollection),
      // so we can extract both userName and collectionSlug from the response.
      const note = await getNoteContent(noteId);
      if (!note) return; // noteNotFound is set inside getNoteContent on failure

      const userName =
        typeof note.userId === "object" && note.userId !== null
          ? (note.userId as { userName: string }).userName
          : authUser?.userName ?? null;

      const collectionSlug =
        typeof note.collectionId === "object" && note.collectionId !== null
          ? (note.collectionId as { slug: string }).slug
          : collections.find((c) => String(c._id) === String(note.collectionId))
              ?.slug ?? null;

      if (!userName || !collectionSlug) {
        // Cannot resolve the canonical URL — surface the not-found UI
        useNoteStore.setState({ noteNotFound: true });
        return;
      }

      router.replace(`/${userName}/${collectionSlug}/${note.seo?.slug || note.slug}`);
    };

    resolve();
    // noteId is the only external dependency; collections/authUser are read
    // synchronously inside the effect, no need to re-run on their changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  if (noteNotFound) return <NoteNotFound />;

  // Show skeleton while resolving / redirecting
  return <NoteSkeleton />;
};

export default NoteRedirectPage;
