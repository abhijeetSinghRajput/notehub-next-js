import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ALIGNMENT_BUTTONS } from "./config/menu.config";
import { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
} from "lucide-react";

const TextAlignDropdown = ({ editor }: { editor: Editor }) => {

  const handleClick = (align: "left" | "center" | "right" | "justify") => {
    editor.chain().focus().setTextAlign(align).run();
  };

  const getIcon = () => {
    if (editor.isActive({ textAlign: "center" }))
      return <AlignCenter />;

    if (editor.isActive({ textAlign: "right" }))
      return <AlignRight />;

    if (editor.isActive({ textAlign: "justify" }))
      return <AlignJustify />;

    return <AlignLeft />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 px-2" tooltip="Text align">
          {getIcon()}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {ALIGNMENT_BUTTONS.map((b) => (
          <DropdownMenuItem
            key={b.name}
            onClick={() =>
              handleClick(b.name as "left" | "center" | "right" | "justify")
            }
            className={
              editor.isActive({ textAlign: b.name }) ? "bg-muted" : ""
            }
          >
            {b.icon}
            <span className="ml-2 capitalize">{b.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TextAlignDropdown;
