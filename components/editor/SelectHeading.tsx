import { Editor } from "@tiptap/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";

export const SelectHeading = ({ editor }: { editor: Editor }) => {
  const headers: { icon: React.ReactNode; level: 2 | 3 | 4; label: string }[] =
    [
      { icon: <Heading1 />, level: 2, label: "Heading 1" },
      { icon: <Heading2 />, level: 3, label: "Heading 2" },
      { icon: <Heading3 />, level: 4, label: "Heading 3" },
    ];

  const handleHeadingSelection = (level: 2 | 3 | 4) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const getIcon = () => {
    let Icon = <Heading />;

    if (editor.isActive("heading", { level: 2 })) Icon = <Heading1 className="size-5"/>;
    if (editor.isActive("heading", { level: 3 })) Icon = <Heading2 className="size-5"/>;
    if (editor.isActive("heading", { level: 4 })) Icon = <Heading3 className="size-5"/>;
    if (editor.isActive("paragraph")) Icon = <Pilcrow />;

    return Icon;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="gap-1 px-2">
        <Button variant="ghost" tooltip="Heading" className="min-w-16">
          {getIcon()}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {headers.map((h) => (
          <DropdownMenuItem
            key={h.level}
            aria-label={`Insert Heading ${h.level}`}
            onClick={() => handleHeadingSelection(h.level)}
            className={
              editor.isActive("heading", { level: h.level }) ? "bg-muted" : ""
            }
          >
            {h.icon}
            <span className="ml-2">{h.label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "bg-muted" : ""}
        >
          <Pilcrow />
          <span className="ml-2">Paragraph</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// export const SelectHeading = ({ editor }: { editor: Editor }) => {
//   const headers: (1 | 2 | 3)[] = [1, 2, 3];

//   return (
//     <Select>
//       <SelectTrigger className="w-20">
//         <SelectValue
//           placeholder={
//             editor.isActive("heading", { level: 1 }) ? (
//               <Heading1 className="size-5" />
//             ) : editor.isActive("heading", { level: 2 }) ? (
//               <Heading2 className="size-5" />
//             ) : editor.isActive("heading", { level: 3 }) ? (
//               <Heading3 className="size-5" />
//             ) : editor.isActive("paragraph") ? (
//               <Pilcrow className="size-4" />
//             ) : (
//               <Heading className="size-4" />
//             )
//           }
//         />
//       </SelectTrigger>
//       <SelectContent className="flex-col">
//         {headers.map((level, index) => (
//           <Button
//             key={index}
//             tooltip={`Heading ${level}`}
//             aria-label={`Insert Heading ${level}`}
//             disabled={editor.isActive("heading", { level })}
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level }).run()
//             }
//             variant={
//               editor.isActive("heading", { level }) ? "secondary" : "ghost"
//             }
//           >
//             H{level}
//           </Button>
//         ))}
//         <Button
//           onClick={() => editor.chain().focus().setParagraph().run()}
//           variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
//         >
//           <Pilcrow />
//         </Button>
//       </SelectContent>
//     </Select>
//   );
// };
