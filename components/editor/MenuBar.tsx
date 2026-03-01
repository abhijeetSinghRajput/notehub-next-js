import React, { Suspense, useEffect, useState } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { Button } from "../ui/button";
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
  LIST_CONTROL_BUTTONS,
  BLOCK_BUTTONS,
  CONTROL_BUTTONS,
  TABLE_BUTTONS,
  TABLE_ROW_CONTROLS,
  TABLE_COLUMN_CONTROLS,
} from "./config/menu.config";
import { LinkDialog } from "./LinkDialog";
const MathDialog = React.lazy(() => import("./MathDialog"));
import AddImageDialog from "./AddImageDialog";
import { useDraftStore } from "@/app/stores/useDraftStore";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TextColorDropdown from "./TextColorDropdown";
import TableRowIcon from "../icons/TableRowIcon";
import TableColIcon from "../icons/TableColIcon";
import ListDropdown from "./ListDropdown";
import TextAlignDropdown from "./TextAlignDropdown";
import AddNodeDropdown from "./AddNodeDropdown";

export const MenuBar = ({ noteId }: { noteId: string }) => {
  const { editor } = useCurrentEditor();
  const { authUser } = useAuthStore();
  const router = useRouter();
  const { updateContent, status, getNoteContent, createNote } = useNoteStore();
  const { clearDraft, getDraft, setDraft } = useDraftStore();

  // Force re-render on editor changes so isActive(...) reflects immediately
  const [__menuVersion, set__menuVersion] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const rerender = () => set__menuVersion((v) => v + 1);
    editor.on("transaction", rerender);
    editor.on("selectionUpdate", rerender);
    editor.on("update", rerender);
    return () => {
      editor.off("transaction", rerender);
      editor.off("selectionUpdate", rerender);
      editor.off("update", rerender);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const isEmptyContent = (html: string) => {
    // text
    if (html.replace(/<[^>]*>/g, "").trim().length > 0) return false;

    // images
    if (/<img\s/i.test(html)) return false;

    // latex (inline or block)
    if (/data-type="(inline-math|block-math)"/.test(html)) return false;

    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // stop browser save
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
  }, [noteId, status.noteContent.state, status.note.state, editor]);

  const handleContentSave = async () => {
    if (!noteId) return;

    let content = editor
      .getHTML()
      .replace(/[^\S\r\n]/g, " ")
      .replace(/<table/g, '<div className="tableWrapper"><table')
      .replace(/<\/table>/g, "</table></div>")
      .replace(/<pre/g, "<div className='relative pre-wrapper'><pre")
      .replace(/<\/pre>/g, "</pre></div>");

    if (isEmptyContent(content)) content = "";

    const isDraftNote = noteId.startsWith("draft-");
    if (isDraftNote) {
      const draft = getDraft(noteId);
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

    await updateContent({
      content,
      noteId: noteId,
    });

    // ✅ Clear draft ONLY after successful save
    clearDraft(noteId);

    router.back(); // goes back one page
  };

  if (!editor) {
    return (
      <div className="controll-group mb-2 sticky top-20 z-10 bg-background border-b border-input" />
    );
  }

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

    // 1️⃣ Fetch fresh content from store (server or cache)
    const note = await getNoteContent(noteId);

    if (note !== null) {
      editor.commands.setContent(note.content); // replace editor content
    } else {
      editor.commands.clearContent(); // fallback if note not found
    }

    // 2️⃣ Clear draft for this user + note
    clearDraft(noteId);
  };

  return (
    <div className="controll-group sticky top-16 z-10 bg-background border-b border-input">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="p-2 Button-group flex gap-1 w-max mx-auto">
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

          <div className="hidden md:flex gap-0.5 border-r pr-1">
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

          <div className="hidden md:flex gap-0.5 border-x px-1">
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

          {LIST_CONTROL_BUTTONS.map(
            ({ icon, command, tooltip, name }, index) => (
              <Button
                tooltip={tooltip}
                aria-label={tooltip}
                key={index}
                size="icon"
                variant="ghost"
                onClick={() => {
                  if ((editor.can() as any)[command](name[0])) {
                    (editor.chain().focus() as any)[command](name[0]).run();
                  } else if ((editor.can() as any)[command](name[1])) {
                    (editor.chain().focus() as any)[command](name[1]).run();
                  }
                }}
                disabled={
                  !(editor.can() as any)[command](name[0]) &&
                  !(editor.can() as any)[command](name[1])
                }
              >
                {icon}
              </Button>
            ),
          )}

          <div className="border-x px-1 shrink-0">
            <TablePopover
              editor={editor}
              triggerTooltip={"table option"}
              controllers={TABLE_BUTTONS}
              triggerIcon={<TableIcon />}
            />
            <TablePopover
              editor={editor}
              triggerTooltip={"column option"}
              controllers={TABLE_COLUMN_CONTROLS}
              triggerIcon={<TableColIcon />}
              triggerDisabled={!editor.isActive("table")}
            />
            <TablePopover
              editor={editor}
              triggerTooltip={"row option"}
              controllers={TABLE_ROW_CONTROLS}
              triggerIcon={<TableRowIcon />}
              triggerDisabled={!editor.isActive("table")}
            />
          </div>

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
