"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { Calendar, Clock, Globe, Lock, Pencil } from "lucide-react";
import { format, formatDate, formatTimeAgo } from "@/lib/utils";
import DateMeta from "./DateMeta";
import type { INote } from "@/types/model";

export type NoteHeaderProps = {
  note: INote;
  /** The user to display as the author. */
  author: {
    userName?: string;
    fullName?: string;
    avatar?: string;
    role?: string;
  };
  /** Whether to show the visibility badge. */
  showVisibility?: boolean;
  /** Whether to show the edit button in the header. */
  showEdit?: boolean;
  /** Called when the edit button is clicked. */
  onEdit?: () => void;
};

export default function NoteHeader({
  note,
  author,
  showVisibility = true,
  showEdit = false,
  onEdit,
}: NoteHeaderProps) {
  return (
    <div className="py-8 px-4 space-y-6 border-b border-dashed mb-6 sm:mb-12">
      <div className="flex items-center justify-between">
        <Link
          href={`/${author?.userName}`}
          className="flex flex-row items-center w-max gap-3"
        >
          <Avatar className="size-12 bg-muted">
            <AvatarImage
              className="w-full h-full object-cover m-0!"
              src={author?.avatar}
              alt={author?.fullName || "Author"}
            />
            <AvatarFallback>
              {(author?.fullName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-semibold flex gap-4 text-primary! items-center text-sm">
              <div className="flex gap-2 items-center">
                <span>{author?.fullName}</span>
                {author?.role === "admin" && (
                  <BadgeIcon className="size-4 text-blue-500" />
                )}
              </div>
              {showVisibility && (
                <Badge
                  variant="ghost"
                  className="p-1 border-none text-muted-foreground"
                >
                  {note.visibility === "public" ? (
                    <Globe size={16} strokeWidth={3} />
                  ) : (
                    <Lock
                      size={16}
                      strokeWidth={3}
                      className="size-4! fill-destructive/20 stroke-destructive"
                    />
                  )}
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              @{author?.userName}
            </span>
          </div>
        </Link>

        {showEdit && onEdit && (
          <Button
            tooltip="Edit Content"
            onClick={onEdit}
            variant="secondary"
            size="lg"
            className="rounded-full w-10 p-0 sm:w-auto sm:px-6 border bg-muted"
          >
            <Pencil />
            <span className="hidden sm:inline-block">Edit</span>
          </Button>
        )}
      </div>

      <div className="flex justify-around gap-8">
        <DateMeta
          icon={<Calendar className="size-4 text-muted-foreground" />}
          label="Created"
          value={
            note?.createdAt
              ? format(new Date(note.createdAt), "MMM d, yyyy")
              : ""
          }
          title={note?.createdAt ? formatDate(String(note.createdAt)) : ""}
        />
        <DateMeta
          icon={<Clock className="size-4 text-muted-foreground" />}
          label="Last Modified"
          value={
            note?.contentUpdatedAt
              ? formatTimeAgo(new Date(note.contentUpdatedAt), "MMM d, yyyy")
              : ""
          }
          title={
            note?.contentUpdatedAt
              ? formatDate(String(note.contentUpdatedAt))
              : ""
          }
        />
      </div>
    </div>
  );
}
