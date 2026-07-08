import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Editor } from "@tiptap/core";
import {
  CodeSquare,
  ImagePlusIcon,
  Plus,
  Sigma,
  TableIcon,
} from "lucide-react";
import BlockquoteIcon from "../icons/BlockquoteIcon";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/useEditorStore";

type AddNodeCommandItem = {
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  command: string;
  params?: Record<string, unknown>;
  dialog?: never;
};

type AddNodeDialogItem = {
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  dialog: "openImageDialog" | "openMathDialog";
  command?: never;
};

type AddNodeItem = AddNodeCommandItem | AddNodeDialogItem;

const ITEMS: AddNodeItem[] = [
  {
    name: "Table",
    icon: <TableIcon />,
    command: "insertTable",
    params: { rows: 3, cols: 3, withHeaderRow: true },
    tooltip: "Table",
  },
  {
    name: "Code Block",
    icon: <CodeSquare />,
    command: "toggleCodeBlock",
    tooltip: "Code Block",
  },
  {
    name: "Blockquote",
    icon: <BlockquoteIcon />,
    command: "toggleBlockquote",
    tooltip: "Blockquote",
  },
  {
    name: "Image",
    icon: <ImagePlusIcon />,
    dialog: "openImageDialog",
    tooltip: "Add image",
  },
  {
    name: "Math Equation",
    icon: <Sigma />,
    dialog: "openMathDialog",
    tooltip: "Math Equation",
  },
];

const AddNodeDropdown = ({
  editor,
  className,
}: {
  editor: Editor;
  className?: string;
}) => {
  const { openDialog } = useEditorStore();

  const canRunCommand = (item: AddNodeItem) => {
    if (!item.command) return true;
    const chain = editor.can().chain().focus() as any;
    const fn = chain?.[item.command];
    if (typeof fn !== "function") return false;
    return item.params ? fn(item.params).run() : fn().run();
  };

  const handleItemClick = (item: AddNodeItem) => {
    if (item.command) {
      const chain = editor.chain().focus() as any;
      const fn = chain?.[item.command];
      if (typeof fn === "function") {
        item.params ? fn(item.params).run() : fn().run();
      }
      return;
    }

    if (item.dialog === "openMathDialog") {
      openDialog("openMathDialog");
      return;
    }

    if (item.dialog === "openImageDialog") {
      openDialog("openImageDialog");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant={"ghost"}
          className={cn("", className)}
          aria-label="Add node"
        >
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.name}
            disabled={!canRunCommand(item)}
            onSelect={(event) => {
              event.preventDefault();
              if (!canRunCommand(item)) return;
              handleItemClick(item);
            }}
          >
            {item.icon}
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddNodeDropdown;
