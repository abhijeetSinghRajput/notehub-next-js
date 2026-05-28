"use client";

import AvatarStack from "@/components/CollaboratorAvatars";
import NotesOption from "@/components/NotesOption";
import TooltipWrapper from "@/components/TooltipWrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { Calendar, EllipsisVertical, File, Lock } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "@/lib/utils";
import { INote, IUser } from "@/types/model";

interface NoteCardProps {
  note: INote;
  isOwner: boolean;
  isAdmin: boolean;
  username: string;
  collectionSlug: string;
}

const NoteCard = ({
  note,
  isOwner,
  isAdmin,
  username,
  collectionSlug,
}: NoteCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const { renameNote } = useNoteStore();
  const canViewSeoScore = isOwner || isAdmin;
  const seoScore = note.seo?.score;

  const renderScoreRing = (score: number) => {
    const r = 14;
    const c = 2 * Math.PI * r;
    const off = c - (score / 100) * c;

    let strokeColor = "stroke-emerald-500";
    if (score < 50) {
      strokeColor = "stroke-rose-500";
    } else if (score < 80) {
      strokeColor = "stroke-amber-500";
    }

    return (
      <svg
        className="h-8 w-8 shrink-0 select-none"
        viewBox="0 0 36 36"
        role="img"
        aria-label={`${score} out of 100`}
      >
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          className="stroke-border"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          className={`${strokeColor} transition-all duration-500 ease-out`}
          strokeWidth="3"
          strokeDasharray={`${c.toFixed(2)}`}
          strokeDashoffset={`${off.toFixed(2)}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text
          x="18"
          y="22"
          textAnchor="middle"
          className="fill-foreground font-medium text-[9px]"
        >
          {score}
        </text>
      </svg>
    );
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      const input = inputRef.current;
      const timeout = setTimeout(() => {
        input.focus();
        input.select();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isRenaming]);

  const handleSaveRename = useCallback(() => {
    const newName = inputRef.current?.value.trim();
    if (newName && newName !== note.name) {
      renameNote({
        noteId: note._id,
        newName: newName,
      });
    }
    setIsRenaming(false);
  }, [note.name, note._id, renameNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        handleSaveRename();
      } else if (e.key === "Escape") {
        if (inputRef.current) {
          inputRef.current.value = note.name;
        }
        setIsRenaming(false);
      }
    },
    [handleSaveRename, note.name],
  );

  return (
    <Card className={"h-full flex flex-col hover:shadow-md transition-shadow"}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <Input
                  ref={inputRef}
                  defaultValue={note.name}
                  className="font-medium h-8 flex-1"
                  onBlur={handleSaveRename}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <File className="size-4 text-muted-foreground shrink-0" />
                  <TooltipWrapper message={note.name}>
                    <Link
                      href={`/${username}/${collectionSlug}/${note.slug}`}
                      className="font-medium text-sm line-clamp-1 hover:underline flex-1"
                    >
                      {note.name}
                    </Link>
                  </TooltipWrapper>
                </>
              )}
            </div>
            <div className="flex mt-2 gap-1 items-center text-muted-foreground">
              <Calendar className="size-3" />
              <span className="text-xs">
                {format(new Date(note.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <NotesOption
                trigger={<EllipsisVertical className="size-4" />}
                note={note}
                setIsRenaming={setIsRenaming}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="mt-auto p-4 pt-0 ">
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex justify-between items-center gap-4">
            {Array.isArray(note.collaborators) && (
              <AvatarStack
                collaborators={note.collaborators as IUser[]}
                maxVisible={2}
                size="sm"
              />
            )}
            {isOwner && note.visibility === "private" && (
              <Badge
                variant={"destructive"}
                className="flex items-center gap-1 h-auto"
              >
                <Lock className="size-3.5" />
                {note.visibility}
              </Badge>
            )}
          </div>
          <div>
            {canViewSeoScore &&
              typeof seoScore === "number" &&
              renderScoreRing(seoScore)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
