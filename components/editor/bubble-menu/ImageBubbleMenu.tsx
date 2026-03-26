import React, { useState, useEffect } from "react";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";

import AlignLeftIcon from "@/components/icons/AlignLeftIcon";
import AlignCenterIcon from "@/components/icons/AlignCenterIcon";
import AlignRightIcon from "@/components/icons/AlignRightIcon";

import { Trash2, ALargeSmall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const BASE_CLASS =
  "hover:bg-neutral-800 active:bg-transparent dark:hover:bg-neutral-800 dark:active:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed";

export default function ImageBubbleMenu() {
  const { editor } = useCurrentEditor();
  const [showAltInput, setShowAltInput] = useState(false);
  const [altText, setAltText] = useState("");

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const attrs = e.getAttributes("image");
      return {
        align: attrs?.align ?? "center",
        alt: attrs?.alt ?? "",
        isLeftActive: e.isActive("image", { align: "left" }),
        isCenterActive: e.isActive("image", { align: "center" }),
        isRightActive: e.isActive("image", { align: "right" }),
        canAlignLeft: e.can().chain().focus().updateAttributes("image", { align: "left" }).run(),
        canAlignCenter: e.can().chain().focus().updateAttributes("image", { align: "center" }).run(),
        canAlignRight: e.can().chain().focus().updateAttributes("image", { align: "right" }).run(),
      };
    },
  });

  // Sync alt text when image selection changes
  useEffect(() => {
    if (editorState?.alt !== undefined) {
      setAltText(editorState.alt);
    }
  }, [editorState?.alt]);

  // Close alt input when bubble menu hides
  useEffect(() => {
    setShowAltInput(false);
  }, [editorState?.alt]);

  if (!editor) return null;

  const setAlign = (value: "left" | "center" | "right") => {
    editor.chain().focus().updateAttributes("image", { align: value }).run();
  };

  const handleAltSave = () => {
    editor.chain().focus().updateAttributes("image", { alt: altText }).run();
    setShowAltInput(false);
  };

  const handleAltKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAltSave();
    if (e.key === "Escape") setShowAltInput(false);
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
      <div className="bubble-menu bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {/* ── Main toolbar ── */}
        <div className="p-1 flex items-center">
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

          {/* Alt text toggle button */}
          <Button
            tooltip="Edit alt text"
            variant="ghost"
            className={cn(
              BASE_CLASS,
              showAltInput && "bg-neutral-800 text-white",
              // Highlight if alt text is already set
              !showAltInput && editorState?.alt && "text-blue-400",
            )}
            onClick={() => setShowAltInput((prev) => !prev)}
          >
            <ALargeSmall className="h-4 w-4" />
          </Button>

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

        {/* ── Alt text input panel ── */}
        {showAltInput && (
          <div className="flex items-center gap-2 px-2 pb-2">
            <Input
              autoFocus
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleAltKeyDown}
              placeholder="Describe this image..."
              className="h-7 text-xs bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-neutral-600"
            />
            <Button
              size="sm"
              className="save-alt-btn"
              onClick={handleAltSave}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}