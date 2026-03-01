"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EditorProvider } from "@tiptap/react";

import { useNoteStore } from "@/app/stores/useNoteStore";
import { useDraftStore } from "@/app/stores/useDraftStore";
import { useImageStore } from "@/app/stores/useImageStore";
import { useEditorStore } from "@/app/stores/useEditorStore";

import { migrateMathStrings } from "@tiptap/extension-mathematics";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import { useParams } from "next/navigation";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import { MenuBar } from "@/components/editor/MenuBar";
import EditorBubbleMenu from "@/components/editor/bubble-menu/EditorBubbleMenu";
import TableHandles from "@/components/editor/TableHandles";
import { extensions } from "@/components/editor/config/extensions.config";
import { Inbox } from "lucide-react";
import { INote } from "@/types/model";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Tiptap = () => {
  const params = useParams();
  const noteId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { getNoteContent, status } = useNoteStore();
  const { getDraft, setDraft } = useDraftStore();
  const { getImages } = useImageStore();
  const { editorFontFamily } = useEditorStore();

  const [note, setNote] = useState<INote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ✅ Stable reference
  const saveDraftCallback = useCallback(
    (noteObj: INote) => {
      if (!noteId) return;
      setDraft(noteId, noteObj);
    },
    [noteId, setDraft],
  );

  const saveDraft = useDebounceCallback(saveDraftCallback, 400);

  useEffect(() => {
    const fetchData = async () => {
      if (!noteId) return;

      setLoading(true);
      setNotFound(false);

      const draft = getDraft(noteId);
      if (draft) {
        setNote(draft);
        setLoading(false);
        return;
      }

      const serverNote = await getNoteContent(noteId);
      if (!serverNote) {
        setNotFound(true);
      } else {
        setNote(serverNote);
      }
      setLoading(false);
    };

    getImages();
    fetchData();

    return () => {
      saveDraft.cancel();
    };
  }, [noteId, getNoteContent, getDraft, getImages]);

  // ✅ BEST SOLUTION: Use functional state update
  const handleUpdate = (html: string) => {
    setNote((prevNote) => {
      if (!prevNote) return prevNote;

      const updatedNote = {
        ...prevNote,
        content: html,
        updatedAt: new Date().toISOString(),
      };
      saveDraft(updatedNote);
      return updatedNote;
    });
  };

  if (notFound) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-md space-y-4">
          <div className="size-20 bg-muted rounded-full flex items-center justify-center">
            <Inbox className="size-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Note Not Found</h3>
            <p className="text-muted-foreground">
              We couldn’t find this note. It may have been deleted or moved. Try
              exploring your notes or create a new one.
            </p>
          </div>

          <Button asChild variant="secondary">
            <Link href="/">Explore Notes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading || status.noteContent.state === "loading") {
    return <NoteSkeleton />;
  }

  if (!note) return null;

  return (
    <>
    <h1 className="sr-only">Edit Note</h1>
    <EditorProvider
      immediatelyRender={false}
      slotBefore={<MenuBar noteId={noteId || ""} />}
      extensions={extensions}
      content={note.content}
      onCreate={({ editor }) => migrateMathStrings(editor)}
      onUpdate={({ editor }) => handleUpdate(editor.getHTML())}
      editorProps={{
        transformPastedHTML(html) {
          const doc = new DOMParser().parseFromString(html, "text/html");

          doc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
            el.style.removeProperty("font-family");
            el.style.removeProperty("font-size");
            el.style.removeProperty("line-height");

            // 🔥 remove background-related styles
            el.style.removeProperty("background");
            el.style.removeProperty("background-color");

            // remove text color
            el.style.removeProperty("color");

            // cleanup empty style attr
            if (!el.getAttribute("style")?.trim()) {
              el.removeAttribute("style");
            }
          });

          return doc.body.innerHTML;
        },
        attributes: {
          class:
            "prose dark:prose-invert mx-auto prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-full",
          style: `font-family: ${editorFontFamily}, serif;`,
          spellcheck: "false",
        },
      }}
    >
      <EditorBubbleMenu />
      <TableHandles />
    </EditorProvider>
    </>
  );
};

export default Tiptap;
