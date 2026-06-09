"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { Button } from "@/components/ui/button";
import {
  UploadCloudIcon,
  Loader2,
  TableIcon,
  CloudDownloadIcon,
} from "lucide-react";
import { SelectHeading } from "./SelectHeading";
import { TablePopover } from "./TablePopover";
import {
  FORMATTING_BUTTONS,
  BLOCK_BUTTONS,
  CONTROL_BUTTONS,
  TABLE_BUTTONS,
} from "./config/menu.config";
import { LinkDialog } from "./LinkDialog";
const MathDialog = React.lazy(() => import("./MathDialog"));
import AddImageDialog from "./AddImageDialog";
import { useDraftStore } from "@/app/stores/useDraftStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import TextColorDropdown from "./TextColorDropdown";
import ListDropdown from "./ListDropdown";
import TextAlignDropdown from "./TextAlignDropdown";
import AddNodeDropdown from "./AddNodeDropdown";
import { revalidateNotePath } from "@/app/actions/revalidate";
import { PopulatedNote } from "@/types/model";

export const MenuBar = ({ noteId }: { noteId: string }) => {
  const { editor } = useCurrentEditor();
  const { authUser } = useAuthStore();
  const router = useRouter();
  const { updateContent, status, getNoteContent, createNote } = useNoteStore();
  const { clearDraft, getDraft, setDraft } = useDraftStore();

  // ── Perf fix: only re-render on cursor/selection changes, NOT on every keystroke ──
  //
  // The previous code listened to "transaction" + "update" which fires on every
  // single character typed, causing the entire toolbar to re-render on every keypress.
  //
  // The toolbar only needs to update when:
  //   1. The cursor moves (selectionUpdate) — to reflect isActive() state
  //   2. Undo/redo ability changes — throttled check via a short timeout
  //
  // "update" (content change) does NOT need to trigger a toolbar re-render
  // because formatting marks don't change when you type regular characters.
  //
  const [, forceUpdate] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;

    // Use rAF to batch rapid selection changes — at most one re-render per frame
    const scheduleUpdate = () => {
      if (rafRef.current !== null) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        forceUpdate((v) => v + 1);
      });
    };

    // selectionUpdate covers: clicking, arrow keys, Ctrl+B/I/U toggling marks.
    // We do NOT listen to "update" (content change) or "transaction" here.
    editor.on("selectionUpdate", scheduleUpdate);
    // "transaction" is needed only to catch undo/redo enabling/disabling.
    // Throttle it so rapid typing still only fires at most once per 200ms.
    let lastTxRender = 0;
    const onTransaction = () => {
      const now = Date.now();
      if (now - lastTxRender > 200) {
        lastTxRender = now;
        scheduleUpdate();
      }
    };
    editor.on("transaction", onTransaction);

    return () => {
      editor.off("selectionUpdate", scheduleUpdate);
      editor.off("transaction", onTransaction);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (
          noteId &&
          status.noteContent.state !== "saving" &&
          status.note.state !== "creating"
        ) {
          handleContentSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [noteId, status.noteContent.state, status.note.state, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const isEmptyContent = (html: string) => {
    if (html.replace(/<[^>]*>/g, "").trim().length > 0) return false;
    if (/<img\s/i.test(html)) return false;
    if (/data-type="(inline-math|block-math)"/.test(html)) return false;
    return true;
  };


  const handleContentSave = async () => {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
    if (!noteId) return;

    let content = editor
      .getHTML()
      .replace(/[^\S\r\n]/g, " ")
      .replace(/<table/g, '<div className="tableWrapper"><table')
      .replace(/<\/table>/g, "</table></div>")
      .replace(/<pre/g, "<div className='relative pre-wrapper'><pre")
      .replace(/<\/pre>/g, "</pre></div>");

    content = content.replace(
      /<a([^>]*?)href="([^"]+)"([^>]*?)>/gi,
      (match, before, href, after) => {
        const isInternal =
          href.startsWith("/") ||
          href.startsWith(APP_URL);

        if (!isInternal) return match;
        console.log({before, href, after})
        return match
          .replace(/\s*target="_blank"/gi, "")
          .replace(/\s*rel="noopener noreferrer"/gi, "");
      }
    );

    if (isEmptyContent(content)) content = "";

    const isDraftNote = noteId.startsWith("draft-");
    const draft = getDraft(noteId);
    const seoPayload = draft?.seo;
    const slugPayload = draft?.slug || undefined;

    if (isDraftNote) {
      const collectionId =
        typeof draft?.collectionId === "string"
          ? draft.collectionId
          : String(draft?.collectionId?._id ?? "");

      if (!draft || !collectionId) {
        toast.error("Draft metadata missing. Please create the note again.");
        return;
      }

      const createdNoteId = await createNote({
        name: draft.name || "Untitled",
        collectionId,
        content,
        visibility: draft.visibility || "private",
        slug: slugPayload,
        seo: seoPayload,
        collaborators: draft.collaborators,
      });

      if (!createdNoteId) return;

      const now = new Date().toISOString();
      setDraft(createdNoteId, {
        ...draft,
        _id: createdNoteId,
        content,
        contentUpdatedAt: now,
        updatedAt: now,
      });
      clearDraft(noteId);
      router.replace(`/note/${createdNoteId}/editor`);
      return;
    }

    const updatedNote = (await updateContent({
      content,
      noteId,
      slug: slugPayload,
      seo: seoPayload,
    })) as PopulatedNote;
    clearDraft(noteId);

    if (
      updatedNote &&
      updatedNote.userId?.userName &&
      updatedNote.collectionId?.slug
    ) {
      const finalSlug = updatedNote.slug;
      if (finalSlug) {
        const path = `/${updatedNote.userId.userName}/${updatedNote.collectionId.slug}/${finalSlug}`;
        await revalidateNotePath(path);
        router.push(path);
        router.refresh();
      } else {
        router.back();
        router.refresh();
      }
    } else {
      router.back();
      router.refresh();
    }
  };

  const handleRevert = async () => {
    if (!noteId || !authUser?._id) return;

    if (noteId.startsWith("draft-")) {
      const draft = getDraft(noteId);
      if (draft) {
        editor.commands.setContent(draft.content || "");
      } else {
        editor.commands.clearContent();
      }
      return;
    }

    const note = await getNoteContent(noteId);
    if (note !== null) {
      editor.commands.setContent(note.content);
    } else {
      editor.commands.clearContent();
    }

    clearDraft(noteId);
  };

  return (
    <div className="controll-group top-16 z-10 sticky bg-background border-input border-b">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="Button-group flex gap-1 mx-auto p-2 w-max">
          <Button
            tooltip={"Ctrl + S"}
            disabled={
              !noteId ||
              status.noteContent.state === "saving" ||
              status.note.state === "creating"
            }
            onClick={handleContentSave}
          >
            {status.noteContent.state === "saving" ||
              status.note.state === "creating" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <UploadCloudIcon />
            )}
            Save
          </Button>

          <div className="hidden md:flex gap-0.5 pr-1 border-r">
            {FORMATTING_BUTTONS.map(
              ({ icon, command, tooltip, name }, index) => (
                <Button
                  tooltip={tooltip}
                  aria-label={tooltip}
                  key={index}
                  size="icon"
                  onClick={() =>
                    (editor.chain().focus() as any)[command]().run()
                  }
                  disabled={
                    !(editor.can().chain().focus() as any)[command]().run()
                  }
                  variant={editor.isActive(name) ? "secondary" : "ghost"}
                >
                  {icon}
                </Button>
              ),
            )}
            <LinkDialog editor={editor} />
          </div>

          <AddNodeDropdown editor={editor} className="md:hidden" />

          <TextColorDropdown editor={editor} />
          <SelectHeading editor={editor} />
          <ListDropdown editor={editor} />
          <TextAlignDropdown editor={editor} />

          <div className="hidden md:flex gap-0.5 pl-1 border-l">
            {BLOCK_BUTTONS.map(({ icon, command, tooltip, name }, index) => (
              <Button
                tooltip={tooltip}
                aria-label={tooltip}
                key={index}
                size="icon"
                onClick={() => (editor.chain().focus() as any)[command]().run()}
                variant={editor.isActive(name) ? "secondary" : "ghost"}
                disabled={
                  name === "code" &&
                  !(editor.can().chain().focus() as any)[command]().run()
                }
              >
                {icon}
              </Button>
            ))}
            <AddImageDialog editor={editor} />
            <Suspense fallback={null}>
              <MathDialog editor={editor} />
            </Suspense>
          </div>

          <TablePopover
            editor={editor}
            triggerTooltip={"table option"}
            controllers={TABLE_BUTTONS}
            triggerIcon={<TableIcon />}
          />

          <span className="bg-border w-px h-10" />

          {CONTROL_BUTTONS.map(({ icon, command, tooltip }, index) => (
            <Button
              tooltip={tooltip}
              aria-label={tooltip}
              key={index}
              size="icon"
              variant="ghost"
              onClick={() => (editor.chain().focus() as any)[command]().run()}
              disabled={!(editor.can().chain().focus() as any)[command]().run()}
            >
              {icon}
            </Button>
          ))}

          <Button
            tooltip={"Revert Back"}
            size="icon"
            variant="outline"
            onClick={handleRevert}
          >
            <CloudDownloadIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};
