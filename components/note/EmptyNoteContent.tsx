"use client";

import { Button } from "@/components/ui/button";
import { Inbox, Pencil } from "lucide-react";

export type EmptyNoteContentProps = {
  /** When provided, renders the "Write" button. */
  onEdit?: () => void;
};

export default function EmptyNoteContent({ onEdit }: EmptyNoteContentProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
      {onEdit && (
        <Button
          onClick={onEdit}
          variant="secondary"
          size="lg"
          className="shadow-md font-semibold"
        >
          <Pencil /> Write
        </Button>
      )}
      <div className="size-16 bg-muted rounded-full flex items-center justify-center">
        <Inbox />
      </div>
      <div>No content</div>
    </div>
  );
}
