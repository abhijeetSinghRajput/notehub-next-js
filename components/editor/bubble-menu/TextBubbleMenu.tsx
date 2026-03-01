import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/useEditorStore";

const BASE_CLASS =
  "hover:bg-neutral-800 active:bg-transparent dark:hover:bg-neutral-800 dark:active:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed";

export default function TextBubbleMenu() {
  const { editor } = useCurrentEditor();
  const { openDialog } = useEditorStore();

  // Reactively derive button states so they update on every editor transaction
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      return {
        isBoldActive: e.isActive("bold"),
        isItalicActive: e.isActive("italic"),
        isUnderlineActive: e.isActive("underline"),
        isStrikeActive: e.isActive("strike"),
        isCodeActive: e.isActive("code"),
        isLinkActive: e.isActive("link"),
        canBold: (e.can().chain().focus() as any).toggleBold().run(),
        canItalic: (e.can().chain().focus() as any).toggleItalic().run(),
        canUnderline: (e.can().chain().focus() as any).toggleUnderline().run(),
        canStrike: (e.can().chain().focus() as any).toggleStrike().run(),
        canCode: (e.can().chain().focus() as any).toggleCode().run(),
      };
    },
  });

  if (!editor) return null;

  const inlineActions = [
    {
      command: "toggleBold",
      tooltip: "Bold",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editorState?.isBoldActive,
      isDisabled: !editorState?.canBold,
      Icon: Bold,
    },
    {
      command: "toggleItalic",
      tooltip: "Italic",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editorState?.isItalicActive,
      isDisabled: !editorState?.canItalic,
      Icon: Italic,
    },
    {
      command: "toggleUnderline",
      tooltip: "Underline",
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editorState?.isUnderlineActive,
      isDisabled: !editorState?.canUnderline,
      Icon: Underline,
    },
    {
      command: "toggleStrike",
      tooltip: "Strikethrough",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editorState?.isStrikeActive,
      isDisabled: !editorState?.canStrike,
      Icon: Strikethrough,
    },
    {
      command: "toggleCode",
      tooltip: "Inline Code",
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editorState?.isCodeActive,
      isDisabled: !editorState?.canCode,
      Icon: Code,
    },
  ];

  return (
    <BubbleMenu
      shouldShow={({ state }) => {
        const { selection } = state;

        // Never show for image
        if (
          selection instanceof NodeSelection &&
          selection.node.type.name === "image"
        ) {
          return false;
        }

        // Must be non-empty text selection
        const hasText = selection instanceof TextSelection && !selection.empty;

        if (!hasText) return false;

        return true;
      }}
    >
      <div className="bubble-menu bg-neutral-900 p-1 flex items-center border border-neutral-800 rounded-xl">
        {inlineActions.map((item, index) => (
          <Button
            tooltip={item.tooltip}
            key={index}
            variant="ghost"
            disabled={item.isDisabled}
            className={cn(BASE_CLASS, item.isActive && "is-active")}
            onClick={item.onClick}
          >
            <item.Icon className="h-4 w-4" />
          </Button>
        ))}

        <span className="bg-border h-8 w-px mx-2" />

        <Button
          variant="ghost"
          className={cn(BASE_CLASS, editorState?.isLinkActive && "is-active")}
          onClick={() => openDialog("openLinkDialog")}
          tooltip="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
}
