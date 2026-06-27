"use client";

import AvatarStack from "@/components/CollaboratorAvatars";
import { Badge } from "@/components/ui/badge";
import { Calendar, File, Lock } from "lucide-react";
import Link from "next/link";
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
  const canViewSeoScore = isOwner || isAdmin;
  const seoScore = note.seo?.score;

  const renderScoreRing = (score: number) => {
    const r = 14;
    const c = 2 * Math.PI * r;
    const off = c - (score / 100) * c;

    let strokeColor = "stroke-emerald-500";

    if (score < 50) strokeColor = "stroke-rose-500";
    else if (score < 90) strokeColor = "stroke-amber-500";

    return (
      <svg
        className="size-8 shrink-0"
        viewBox="0 0 36 36"
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
          className={`${strokeColor} transition-all duration-500`}
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text
          x="18"
          y="22"
          textAnchor="middle"
          className="fill-foreground text-[9px] font-medium"
        >
          {score}
        </text>
      </svg>
    );
  };

  return (
    <Link
      href={`/${username}/${collectionSlug}/${note.slug}`}
      className="group screen-line-top screen-line-bottom flex h-full flex-col justify-between p-4 transition-colors hover:bg-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <File className="size-4 shrink-0 text-muted-foreground" />
          <h3 className="line-clamp-1 text-sm font-medium">{note.name}</h3>
        </div>

        {canViewSeoScore &&
          typeof seoScore === "number" &&
          renderScoreRing(seoScore)}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="size-3" />
          <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
        </div>

        <div className="flex items-center gap-3">
          {Array.isArray(note.collaborators) && (
            <AvatarStack
              collaborators={note.collaborators as IUser[]}
              maxVisible={2}
              size="sm"
            />
          )}

          {isOwner && note.visibility === "private" && (
            <Badge
              variant="destructive"
              className="flex h-auto items-center gap-1"
            >
              <Lock className="size-3.5" />
              {note.visibility}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
};

export default NoteCard;