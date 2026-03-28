// components/article-card/NoteTitle.tsx
"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useNoteStore } from "@/app/stores/useNoteStore";
import type { INote } from "@/types/model";

interface NoteTitleProps {
  note: INote;
  isRenaming: boolean;
  onRename: (value: boolean) => void;
}

export function NoteTitle({ note, isRenaming, onRename }: NoteTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const renameNote = useNoteStore((state) => state.renameNote);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isRenaming]);

  const handleSave = () => {
    const newName = inputRef.current?.value.trim();
    if (newName && newName !== note.name) {
      renameNote({ noteId: note._id, newName });
    }
    onRename(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      if (inputRef.current) inputRef.current.value = note.name;
      onRename(false);
    }
  };

  if (!isRenaming) return null;

  return (
    <Input
      ref={inputRef}
      defaultValue={note.name}
      className="font-bold h-8 flex-1"
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  );
}