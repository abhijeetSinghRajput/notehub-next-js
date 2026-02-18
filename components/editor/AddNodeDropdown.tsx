import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Editor } from "@tiptap/core";
import {
  CodeSquare,
  ImagePlusIcon,
  Plus,
  Sigma,
} from "lucide-react";
import BlockquoteIcon from "../icons/BlockquoteIcon";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/useEditorStore";

type AddNodeCommandItem = {
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  command: string;
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
    name: "Math Equation",
    icon: <Sigma />,
    dialog: "openMathDialog",
    tooltip: "Math Equation",
  },
  {
    name: "Image",
    icon: <ImagePlusIcon />,
    dialog: "openImageDialog",
    tooltip: "Add image",
  },
];

const AddNodeDropdown = ({ editor, className }: { editor: Editor; className?: string }) => {
  const { openDialog } = useEditorStore();

  const canRunCommand = (command?: string) => {
    if (!command) return true;
    const chain = editor.can().chain().focus() as any;
    const fn = chain?.[command];
    if (typeof fn !== "function") return false;
    return fn().run();
  };

  const handleItemClick = (item: AddNodeItem) => {
    if (item.command) {
      const chain = editor.chain().focus() as any;
      const fn = chain?.[item.command];
      if (typeof fn === "function") {
        fn().run();
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
        <Button size="icon" variant={"ghost"} className={cn("", className)} aria-label="Add node">
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.name}
            disabled={!canRunCommand(item.command)}
            onSelect={(event) => {
              event.preventDefault();
              if (!canRunCommand(item.command)) return;
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

// <div className="flex gap-0.5 border-x px-1">
//           {BLOCK_BUTTONS.map(({ icon, command, tooltip, name }, index) => (
//             <Button
//               tooltip={tooltip}
//               aria-label={tooltip}
//               key={index}
//               size="icon"
//               onClick={() => (editor.chain().focus() as any)[command]().run()}
//               variant={editor.isActive(name) ? "secondary" : "ghost"}
//               disabled={
//                 name === "code" &&
//                 !(editor.can().chain().focus() as any)[command]().run()
//               }
//             >
//               {icon}
//             </Button>
//           ))}
//           <AddImageDialog editor={editor} />
//           <Suspense fallback={null}>
//             <MathDialog editor={editor} />
//           </Suspense>
//         </div>
