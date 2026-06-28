"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorProvider } from "@tiptap/react";
import { use } from "react";

import { useDraftStore } from "@/app/stores/useDraftStore";
import { useImageStore } from "@/app/stores/useImageStore";
import { useEditorStore } from "@/app/stores/useEditorStore";

import { migrateMathStrings } from "@tiptap/extension-mathematics";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import NoteSkeleton from "@/components/sekeletons/NoteSkeleton";
import { MenuBar } from "@/components/editor/MenuBar";
import EditorBubbleMenu from "@/components/editor/bubble-menu/EditorBubbleMenu";
import TableHandles from "@/components/editor/TableHandles";
import { extensions } from "@/components/editor/config/extensions.config";
import { Inbox } from "lucide-react";
import { INote } from "@/types/model";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { axiosInstance } from "@/lib/axios";
import { SeoSidebar } from "@/components/editor/SeoSidebar";

type Props = {
  params: Promise<{
    username: string;
    collectionSlug: string;
    noteSlug: string;
  }>;
};

const Tiptap = ({ params }: Props) => {
  // Unwrap the params Promise using React.use() — valid in Client Components (React 19)
  const { username, collectionSlug, noteSlug } = use(params);

  const { getDraft, setDraft } = useDraftStore();
  const { getImages } = useImageStore();
  const { editorFontFamily } = useEditorStore();

  const [note, setNote] = useState<INote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Refs for zero-overhead typing path ─────────────────────────────────────
  // The editor manages its own state via ProseMirror. React only needs the note
  // for the initial render and metadata (name, visibility, etc.) for draft saves.
  // By using refs instead of state for the update path, we avoid re-rendering
  // the entire component tree (MenuBar, BubbleMenu, TableHandles, etc.) on
  // every single keystroke.
  const editorRef = useRef<any>(null);
  const noteRef = useRef<INote | null>(null);

  // Keep noteRef in sync — only runs when `note` state changes (initial load),
  // never during typing.
  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  // ── Debounced draft save ─────────────────────────────────────────────────
  // editor.getHTML() is O(n) in document size and was previously called
  // synchronously on every keystroke, blocking input for 5-20ms+ on large docs.
  // Now it only runs after 800ms of inactivity — zero synchronous cost while typing.
  const debouncedDraftSave = useDebounceCallback(
    useCallback(() => {
      const editor = editorRef.current;
      const currentNote = noteRef.current;
      // noteId is derived from the fetched note — safe to read from ref here
      const noteId = currentNote?._id;
      if (!editor || editor.isDestroyed || !currentNote || !noteId) return;
      const html = editor.getHTML();
      setDraft(noteId, {
        ...currentNote,
        content: html,
        updatedAt: new Date().toISOString(),
      });
    }, [setDraft]),
    800,
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const { data } = await axiosInstance.get(
          `/note/${username}/${collectionSlug}/${noteSlug}`,
          { signal: controller.signal },
        );

        const fetchedNote: INote = data.note;

        // Check for a draft using the real _id from the API response
        const draft = getDraft(fetchedNote._id);
        setNote(draft ?? fetchedNote);
      } catch (error: any) {
        if (error?.name === "CanceledError") return;
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    getImages();
    fetchData();

    return () => {
      controller.abort();
      debouncedDraftSave.cancel();
    };
  }, [username, collectionSlug, noteSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── onUpdate handler: zero synchronous work ─────────────────────────────
  // Just kicks the debounce timer. No getHTML(), no setState(), no React re-render.
  const handleEditorUpdate = useCallback(() => {
    debouncedDraftSave();
  }, [debouncedDraftSave]);

  // ── Memoize editorProps so EditorProvider doesn't reconfigure ProseMirror ──
  const editorProps = useMemo(
    () => ({
      transformPastedHTML(html: string) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
          el.style.removeProperty("font-family");
          el.style.removeProperty("font-size");
          el.style.removeProperty("line-height");
          el.style.removeProperty("background");
          el.style.removeProperty("background-color");
          el.style.removeProperty("color");
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
    }),
    [editorFontFamily],
  );

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
              We couldn't find this note. It may have been deleted or moved. Try
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

  if (loading) {
    return <NoteSkeleton />;
  }

  if (!note) return null;

  return (
    <EditorProvider
      immediatelyRender={false}
      slotBefore={<MenuBar noteId={note._id} />}
      extensions={extensions}
      content={note.content}
      onCreate={({ editor }: any) => {
        editorRef.current = editor;
        migrateMathStrings(editor);
      }}
      onUpdate={handleEditorUpdate}
      editorProps={editorProps}
    >
      <EditorBubbleMenu />
      <TableHandles />
      <SeoSidebar note={note} />
    </EditorProvider>
  );
};

export default Tiptap;