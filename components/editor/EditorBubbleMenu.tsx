import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import AlignLeftIcon from "../icons/AlignLeftIcon";
import AlignCenterIcon from "../icons/AlignCenterIcon";
import AlignRightIcon from "../icons/AlignRightIcon";
import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function EditorBubbleMenu() {
  const { editor } = useCurrentEditor();
  if (!editor) return null;

  // -------- Image alignment --------
  const setAlign = (align: string) => {
    editor.chain().focus().updateAttributes("image", { align }).run();
  };

  const { align, isImageSelected } = useEditorState({
    editor,
    selector: ({ editor }) => {
      const { selection } = editor.state;

      const selectedImageNode =
        selection instanceof NodeSelection && selection.node.type.name === "image"
          ? selection.node
          : null;

      const isImageActive = selectedImageNode !== null || editor.isActive("image");
      const imageAttributes = editor.getAttributes("image");

      return {
        isImageSelected: isImageActive,
        align: isImageActive ? imageAttributes.align ?? "center" : null,
      };
    },
  });

  const imageActions = [
    { tooltip: "Left", onClick: () => setAlign("left"), isActive: align === "left", Icon: AlignLeftIcon },
    { tooltip: "Center", onClick: () => setAlign("center"), isActive: align === "center", Icon: AlignCenterIcon },
    { tooltip: "Right", onClick: () => setAlign("right"), isActive: align === "right", Icon: AlignRightIcon },
  ];

  const formatActions = [
    { tooltip: "Bold", onClick: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), Icon: Bold },
    { tooltip: "Italic", onClick: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), Icon: Italic },
    { tooltip: "Underline", onClick: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline"), Icon: Underline },
    { tooltip: "Strike", onClick: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), Icon: Strikethrough },
  ];

  return (
    <>
      <BubbleMenu
        editor={editor}
        pluginKey="formatting-bubble-menu"
        options={{ placement: "bottom", offset: 8, flip: true }}
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
        <div className="bubble-menu bg-zinc-900 p-1 flex items-center gap-1 border border-zinc-800 rounded-xl">
          {(isImageSelected ? imageActions : formatActions).map((item, index) => (
            <Button
              key={index}
              variant={"ghost"}
              className={cn("hover:bg-zinc-800 dark:hover:bg-zinc-800", item.isActive && "is-active")}
              onClick={item.onClick}
            >
              <item.Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </BubbleMenu>
    </>
  );
}
