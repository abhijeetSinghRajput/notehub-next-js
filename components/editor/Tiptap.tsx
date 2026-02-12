import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EditorProvider } from "@tiptap/react";

import { extensions } from "./config/extensions.config";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { useDraftStore } from "@/app/stores/useDraftStore";
import { useImageStore } from "@/app/stores/useImageStore";
import { useEditorStore } from "@/app/stores/useEditorStore";

import NoteSkeleton from "../sekeletons/NoteSkeleton";
import { MenuBar } from "./MenuBar";
import { migrateMathStrings } from "@tiptap/extension-mathematics";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import EditorBubbleMenu from "./EditorBubbleMenu";
import { useParams } from "next/navigation";
import { Inbox } from "lucide-react";
import { INote } from "@/types/model";

const Tiptap = () => {
  const { id } = useParams();
  const noteId = Array.isArray(id) ? id[0] : id!;

  const { getNoteContent, status } = useNoteStore();
  const { getDraft, setDraft } = useDraftStore();
  const { getImages } = useImageStore();
  const { editorFontFamily } = useEditorStore();

  const [note, setNote] = useState({ content: "", name: "" });
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
      const updatedNote = {
        ...prevNote,
        content: html,
        updatedAt: new Date(), 
      };
      saveDraft(updatedNote as INote);
      return updatedNote;
    });
  };

  if (notFound) {
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

  if (loading || status.noteContent.state === "loading") {
    return <NoteSkeleton />;
  }

  return (
    <EditorProvider
      slotBefore={<MenuBar noteId={noteId} />}
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
    </EditorProvider>
  );
};

export default Tiptap;
