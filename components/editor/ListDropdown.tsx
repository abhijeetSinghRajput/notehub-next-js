import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown, List, ListOrdered, ListTodo } from "lucide-react";
import { LIST_BUTTONS } from "./config/menu.config";
import { Editor } from "@tiptap/core";

const ListDropdown = ({ editor }: { editor: Editor }) => {
  const handleClick = (command: string) => {
    const chain = editor.chain().focus() as any;
    if (typeof chain[command] === "function") {
      chain[command]().run();
    }
  };

  const getIcon = () => {
    if (editor.isActive("orderedList")) return <ListOrdered  />
    if (editor.isActive("bulletList")) return <List  />;
    if (editor.isActive("taskList")) return <ListTodo  />;

    return <List  />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 px-2" tooltip="list">
          {getIcon()}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {LIST_BUTTONS.map((b) => (
          <DropdownMenuItem
            key={b.name}
            onClick={() => handleClick(b.command)}
            className={
              editor.isActive(b.name) ? "bg-muted" : ""
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

export default ListDropdown;


// {LIST_BUTTONS.map(({ icon, command, tooltip, name }, index) => (
//           <Button
//             tooltip={tooltip}
//             aria-label={tooltip}
//             key={index}
//             size="icon"
//             onClick={() => (editor.chain().focus() as any)[command]().run()}
//             variant={editor.isActive(name) ? "secondary" : "ghost"}
//           >
//             {icon}
//           </Button>
//         ))}
