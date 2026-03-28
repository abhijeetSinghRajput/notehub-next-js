import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import AlignLeftIcon from "../icons/AlignLeftIcon";
import AlignCenterIcon from "../icons/AlignCenterIcon";
import AlignRightIcon from "../icons/AlignRightIcon";
import {
  Bold,
  Code,
  Italic,
  LinkIcon,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/useEditorStore";

export default function EditorBubbleMenu() {
  const { editor } = useCurrentEditor();
  const { openDialog } = useEditorStore();

  // -------- Image alignment --------
  const setAlign = (align: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes("image", { align }).run();
  };

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isImageSelected: false,
          align: null,
        };
      }
      const { selection } = editor.state;

      const selectedImageNode =
        selection instanceof NodeSelection &&
        selection.node.type.name === "image"
          ? selection.node
          : null;

      const isImageActive =
        selectedImageNode !== null || editor.isActive("image");
      const imageAttributes = editor.getAttributes("image");

      return {
        isImageSelected: isImageActive,
        align: isImageActive ? (imageAttributes.align ?? "center") : null,
      };
    },
  });

  const align = editorState?.align ?? null;
  const isImageSelected = editorState?.isImageSelected ?? false;

  if (!editor) return null;

  const imageActions = [
    {
      tooltip: "Left",
      onClick: () => setAlign("left"),
      isActive: align === "left",
      isDisabled: !editor ||
        !editor
          .can()
          .chain()
          .focus()
          .updateAttributes("image", { align: "left" })
          .run(),
      Icon: AlignLeftIcon,
    },
    {
      tooltip: "Center",
      onClick: () => setAlign("center"),
      isActive: align === "center",
      isDisabled: !editor ||
        !editor
          .can()
          .chain()
          .focus()
          .updateAttributes("image", { align: "center" })
          .run(),
      Icon: AlignCenterIcon,
    },
    {
      tooltip: "Right",
      onClick: () => setAlign("right"),
      isActive: align === "right",
      isDisabled: !editor ||
        !editor
          .can()
          .chain()
          .focus()
          .updateAttributes("image", { align: "right" })
          .run(),
      Icon: AlignRightIcon,
    },
  ];

  const inlineActions = [
    {
      command: "toggleBold",
      tooltip: "Bold",
      onClick: () => editor?.chain().focus().toggleBold().run(),
      isActive: !!editor && editor.isActive("bold"),
      Icon: Bold,
    },
    {
      command: "toggleItalic",
      tooltip: "Italic",
      onClick: () => editor?.chain().focus().toggleItalic().run(),
      isActive: !!editor && editor.isActive("italic"),
      Icon: Italic,
    },
    {
      command: "toggleUnderline",
      tooltip: "Underline",
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: !!editor && editor.isActive("underline"),
      Icon: Underline,
    },
    {
      command: "toggleStrike",
      tooltip: "Strike",
      onClick: () => editor?.chain().focus().toggleStrike().run(),
      isActive: !!editor && editor.isActive("strike"),
      Icon: Strikethrough,
    },
    {
      command: "toggleCode",
      tooltip: "Inline Code",
      onClick: () => editor?.chain().focus().toggleCode().run(),
      isActive: !!editor && editor.isActive("code"),
      Icon: Code,
    },
  ];

  const BASE_CLASS =
    "hover:bg-neutral-800 active:bg-transparent dark:hover:bg-neutral-800 dark:active:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <BubbleMenu
        editor={editor}
        pluginKey="formatting-bubble-menu"
        options={{ placement: "bottom", offset: 20, flip: true }}
        shouldShow={({ editor, state }) => {
          const { selection } = state;

          const hasTextSelection =
            selection instanceof TextSelection &&
            !selection.empty &&
            !editor.isActive("image") &&
            !editor.isActive("table");

          return hasTextSelection || isImageSelected;
        }}
      >
        <div className="bubble-menu bg-neutral-900 p-1 flex items-center border border-neutral-800 rounded-xl">
          {(isImageSelected ? imageActions : inlineActions).map(
            (item, index) => (
              <Button
                key={index}
                variant={"ghost"}
                disabled={
                  "command" in item
                    ? !(editor.can().chain().focus() as any)
                        [item.command]()
                        .run()
                    : item.isDisabled
                }
                className={cn(BASE_CLASS, item.isActive && "is-active")}
                onClick={item.onClick}
              >
                <item.Icon className="h-4 w-4" />
              </Button>
            ),
          )}

          <span className="bg-border h-8 w-px mx-2" />

          <Button
            variant={"ghost"}
            className={cn(BASE_CLASS, editor.isActive("link") && "is-active")}
            onClick={() => openDialog("openLinkDialog")}
          >
            <LinkIcon />
          </Button>
        </div>
      </BubbleMenu>
    </>
  );
}
