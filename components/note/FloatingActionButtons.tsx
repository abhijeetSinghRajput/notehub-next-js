"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
