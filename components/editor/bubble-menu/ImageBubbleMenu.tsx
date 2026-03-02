import React from "react";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";

import AlignLeftIcon from "@/components/icons/AlignLeftIcon";
import AlignCenterIcon from "@/components/icons/AlignCenterIcon";
import AlignRightIcon from "@/components/icons/AlignRightIcon";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE_CLASS =
  "hover:bg-neutral-800 active:bg-transparent dark:hover:bg-neutral-800 dark:active:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed";

export default function ImageBubbleMenu() {
  const { editor } = useCurrentEditor();

  // Reactively derive button states so they update on every editor transaction
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const attrs = e.getAttributes("image");
      const align = attrs?.align ?? "center";
      return {
        align,
        isLeftActive: e.isActive("image", { align: "left" }),
        isCenterActive: e.isActive("image", { align: "center" }),
        isRightActive: e.isActive("image", { align: "right" }),
        canAlignLeft: e.can().chain().focus().updateAttributes("image", { align: "left" }).run(),
        canAlignCenter: e.can().chain().focus().updateAttributes("image", { align: "center" }).run(),
        canAlignRight: e.can().chain().focus().updateAttributes("image", { align: "right" }).run(),
      };
    },
  });

  if (!editor) return null;

  const setAlign = (value: "left" | "center" | "right") => {
    editor.chain().focus().updateAttributes("image", { align: value }).run();
  };

  const imageActions = [
    {
      tooltip: "Align Left",
      onClick: () => setAlign("left"),
      isActive: editorState?.isLeftActive,
      isDisabled: !editorState?.canAlignLeft,
      Icon: AlignLeftIcon,
    },
    {
      tooltip: "Align Center",
      onClick: () => setAlign("center"),
      isActive: editorState?.isCenterActive,
      isDisabled: !editorState?.canAlignCenter,
      Icon: AlignCenterIcon,
    },
    {
      tooltip: "Align Right",
      onClick: () => setAlign("right"),
      isActive: editorState?.isRightActive,
      isDisabled: !editorState?.canAlignRight,
      Icon: AlignRightIcon,
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="image-bubble-menu"
      shouldShow={({ state }) => {
        const { selection } = state;

        return (
          selection instanceof NodeSelection &&
          selection.node.type.name === "image"
        );
      }}
    >
      <div className="bubble-menu bg-neutral-900 p-1 flex items-center border border-neutral-800 rounded-xl">
        {imageActions.map((item, index) => {
          const IconComponent = item.Icon as React.ComponentType<{
            className?: string;
          }>;

          return (
            <Button
              key={index}
              tooltip={item.tooltip}
              variant="ghost"
              disabled={item.isDisabled}
              className={cn(BASE_CLASS, item.isActive && "is-active")}
              onClick={item.onClick}
            >
              <IconComponent className="h-4 w-4" />
            </Button>
          );
        })}

        <span className="bg-neutral-800 h-8 w-px mx-2" />

        <Button
          variant="ghost"
          className={cn(BASE_CLASS, "text-red-400 hover:text-red-300")}
          onClick={() => editor.chain().focus().deleteSelection().run()}
          tooltip="Delete image"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
}
