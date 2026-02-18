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
import TextColorDropdown from "./TextColorDropdown";
import TableRowIcon from "../icons/TableRowIcon";
import TableColIcon from "../icons/TableColIcon";
import ListDropdown from "./ListDropdown";
import TextAlignDropdown from "./TextAlignDropdown";

export const MenuBar = ({ noteId }: { noteId: string }) => {
  const { editor } = useCurrentEditor();
  const { authUser } = useAuthStore();
  const router = useRouter();
  const { updateContent, status, getNoteContent } = useNoteStore();
  const { clearDraft } = useDraftStore();

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
        if (noteId && status.noteContent.state !== "saving") {
          handleContentSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [noteId, status.noteContent.state, editor]);

  const handleContentSave = async () => {
    let content = editor
      .getHTML()
      .replace(/[^\S\r\n]/g, " ")
      .replace(/<table/g, '<div className="tableWrapper"><table')
      .replace(/<\/table>/g, "</table></div>")
      .replace(/<pre/g, "<div className='relative pre-wrapper'><pre")
      .replace(/<\/pre>/g, "</pre></div>");

    if (isEmptyContent(content)) content = "";
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
    <div className="controll-group flex justify-center mb-2 sticky top-16 z-10 bg-background border-b border-input">
      <div className="p-2 Button-group flex gap-1 overflow-y-auto hide-scrollbar">
        <Button
          tooltip={"Ctrl + S"}
          disabled={!noteId || status.noteContent.state === "saving"}
          onClick={handleContentSave}
        >
          {status.noteContent.state === "saving" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <UploadCloudIcon />
          )}
          Save
        </Button>

        {FORMATTING_BUTTONS.map(({ icon, command, tooltip, name }, index) => (
          <Button
            tooltip={tooltip}
            aria-label={tooltip}
            key={index}
            size="icon"
            onClick={() => (editor.chain().focus() as any)[command]().run()}
            disabled={!(editor.can().chain().focus() as any)[command]().run()}
            variant={editor.isActive(name) ? "secondary" : "ghost"}
          >
            {icon}
          </Button>
        ))}

        <TextColorDropdown editor={editor} />
        <SelectHeading editor={editor} />
        <ListDropdown editor={editor} />
        <TextAlignDropdown editor={editor} />

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

        {LIST_CONTROL_BUTTONS.map(({ icon, command, tooltip, name }, index) => (
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
        ))}

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
        <div className="border rounded-lg shrink-0">
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
          />
          <TablePopover
            editor={editor}
            triggerTooltip={"row option"}
            controllers={TABLE_ROW_CONTROLS}
            triggerIcon={<TableRowIcon />}
          />
        </div>

        <AddImageDialog editor={editor} />
        <Suspense fallback={null}>
          <MathDialog editor={editor} />
        </Suspense>
        <LinkDialog editor={editor} />

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
  );
};
