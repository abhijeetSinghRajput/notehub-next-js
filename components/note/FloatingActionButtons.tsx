"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Pencil, TextQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import EditorTypographyControls from "@/components/editor/EditorTypographyControls";
import SharePopover from "@/components/ShareNotePopover.client";
import type { TocItem } from "@/lib/note/types";

const MemoEditorTypographyControls = memo(EditorTypographyControls);
const MemoSharePopover = memo(SharePopover);

export type FloatingActionButtonsProps = {
  toc: TocItem[];
  tocOpen: boolean;
  setTocOpen: React.Dispatch<React.SetStateAction<boolean>>;
  progress: number;
  activeId: string | null;
  handleTocItemClick: (id: string) => void;
  shareLink: string;
  /** When provided, renders the edit button. */
  onEdit?: () => void;
};

const FloatingActionButtons = memo<FloatingActionButtonsProps>(
  ({
    toc,
    tocOpen,
    setTocOpen,
    progress,
    activeId,
    handleTocItemClick,
    shareLink,
    onEdit,
  }) => (
    <div className="flex gap-2 items-center fixed bottom-4 right-4">
      {toc.length > 1 && (
        <Popover open={tocOpen} onOpenChange={setTocOpen}>
          <PopoverTrigger asChild>
            <Button
              className="hover:bg-primary h-11 gap-4 rounded-full py-1.5 px-2 pl-4"
              variant="default"
            >
              <div className="flex items-center gap-2">
                <TextQuote />
                Index <ChevronsUpDown className="text-primary-foreground" />
              </div>
              <div className="bg-muted/5 p-2 py-1.5 rounded-full min-w-12.5">
                {progress}%
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            alignOffset={-50}
            className="rounded-2xl min-w-max pr-1"
          >
            <ScrollArea>
              <div className="max-w-75 sm:max-w-sm max-h-[60vh] pr-4">
                <div className="space-y-2">
                  {toc.map((item) => (
                    <p
                      key={item.id}
                      onClick={() => handleTocItemClick(item.id)}
                      className={cn(
                        "cursor-pointer list-decimal text-base/6! text-muted-foreground hover:text-primary transition-colors",
                        activeId === item.id && "text-primary font-semibold",
                      )}
                      style={{ paddingLeft: (item.level - 1) * 12 }}
                    >
                      {item.text}
                    </p>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}

      <MemoEditorTypographyControls />
      <MemoSharePopover shareLink={shareLink} />
      {onEdit && (
        <Button
          onClick={onEdit}
          size="icon"
          tooltip="Edit Content"
          className="size-11 rounded-full"
          aria-label="Edit content"
        >
          <Pencil />
        </Button>
      )}
    </div>
  ),
);
FloatingActionButtons.displayName = "FloatingActionButtons";

export default FloatingActionButtons;
