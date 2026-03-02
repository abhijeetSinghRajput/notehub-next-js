import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import {
  List,
  ListOrdered,
  ListTodo,
  IndentDecrease,
  IndentIncrease,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE_CLASS =
  "hover:bg-neutral-800 active:bg-transparent dark:hover:bg-neutral-800 dark:active:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed";

export default function ListBubbleMenu() {
  const { editor } = useCurrentEditor();

  // Reactively derive button states so they update on every editor transaction
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      return {
        isBulletListActive: e.isActive("bulletList"),
        isOrderedListActive: e.isActive("orderedList"),
        isTaskListActive: e.isActive("taskList"),
        canToggleBulletList: e.can().chain().focus().toggleBulletList().run(),
        canToggleOrderedList: e.can().chain().focus().toggleOrderedList().run(),
        canToggleTaskList: e.can().chain().focus().toggleTaskList().run(),
        canLiftListItem: e.can().chain().focus().liftListItem("listItem").run(),
        canSinkListItem: e.can().chain().focus().sinkListItem("listItem").run(),
      };
    },
  });

  if (!editor) return null;

  const listActions = [
    {
      tooltip: "Bullet List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editorState?.isBulletListActive,
      isDisabled: false,
      Icon: List,
    },
    {
      tooltip: "Ordered List",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editorState?.isOrderedListActive,
      isDisabled: false,
      Icon: ListOrdered,
    },
    {
      tooltip: "Task List",
      onClick: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editorState?.isTaskListActive,
      isDisabled: false,
      Icon: ListTodo,
    },
  ];

  const indentActions = [
    {
      tooltip: "Decrease indent (lift)",
      onClick: () => editor.chain().focus().liftListItem("listItem").run(),
      isDisabled: !editorState?.canLiftListItem,
      Icon: IndentDecrease,
    },
    {
      tooltip: "Increase indent (sink)",
      onClick: () => editor.chain().focus().sinkListItem("listItem").run(),
      isDisabled: !editorState?.canSinkListItem,
      Icon: IndentIncrease,
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="list-bubble-menu"
      options={{
        placement: "bottom",
        // offset: 10,
      }}
      shouldShow={({ state, editor }) => {
        const { selection } = state;

        // ❌ never show if image selected
        if (
          selection instanceof NodeSelection &&
          selection.node.type.name === "image"
        ) {
          return false;
        }

        // Only collapsed cursor
        const isCollapsed =
          selection instanceof TextSelection && selection.empty;

        if (!isCollapsed) return false;

        // Must be inside list
        return (
          editor.isActive("bulletList") ||
          editor.isActive("orderedList") ||
          editor.isActive("taskList")
        );
      }}
    >
      <div className="bubble-menu bg-neutral-900 p-1 flex items-center border border-neutral-800 rounded-xl">
        {listActions.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            disabled={item.isDisabled}
            className={cn(BASE_CLASS, item.isActive && "is-active")}
            onClick={item.onClick}
            tooltip={item.tooltip}
          >
            <item.Icon className="h-4 w-4" />
          </Button>
        ))}

        <span className="bg-neutral-800 h-8 w-px mx-2" />

        {indentActions.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            disabled={item.isDisabled}
            className={cn(BASE_CLASS)}
            onClick={item.onClick}
            tooltip={item.tooltip}
          >
            <item.Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </BubbleMenu>
  );
}
