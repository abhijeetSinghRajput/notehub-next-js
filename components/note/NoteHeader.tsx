"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Globe, Lock, Pencil, MoreHorizontal, Users, Check, Hash, TextCursor, Loader2, X, Settings } from "lucide-react";
import { cn, format, formatTimeAgo } from "@/lib/utils";
import { axiosInstance } from "@/lib/axios";
import BadgeIcon from "@/components/icons/BadgeIcon";
import type { INote, IUser } from "@/types/model";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import TooltipWrapper from "../TooltipWrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { BaseCollaboratorsDialog } from "../CollaboratorsDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const router = useRouter();
  const { updateNote, updateNoteCollaborators, status } = useNoteStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: note.name || "",
    slug: note.slug || "",
    visibility: note.visibility || "private",
  });

  const [manualSlug, setManualSlug] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Auto-slug generation
  useEffect(() => {
    if (!manualSlug && isSettingsOpen && formData.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(formData.name),
      }));
    }
  }, [formData.name, manualSlug, isSettingsOpen]);

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug.trim()) {
      setIsSlugAvailable(null);
      return;
    }

    if (formData.slug === note.slug) {
      setIsSlugAvailable(true);
      return;
    }

    const checkAvailability = async () => {
      setIsCheckingSlug(true);
      try {
        const collectionId = typeof note.collectionId === "string" ? note.collectionId : (note.collectionId as { _id: string })?._id;
        if (!collectionId) return;

        const res = await axiosInstance.get(
          `/note/check-availability?collectionId=${collectionId}&slug=${formData.slug}&noteId=${note._id}`
        );
        setIsSlugAvailable(res.data.available);
      } catch (error) {
        console.error("Slug check failed", error);
        setIsSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [formData.slug, note._id, note.collectionId, note.slug]);

  // Sync with note prop
  useEffect(() => {
    setFormData({
      name: note.name || "",
      slug: note.slug || "",
      visibility: note.visibility || "private",
    });
  }, [note.name, note.slug]);

  const readingTime = useMemo(() => {
    const text = note.content?.replace(/<[^>]*>/g, "") || "";
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 225));
  }, [note.content]);

  const handleUpdateNote = async () => {
    if (!formData.name.trim()) return toast.error("Title cannot be empty");

    setIsSaving(true);
    try {
      await updateNote(note._id, {
        name: formData.name,
        slug: formData.slug,
        visibility: formData.visibility,
      });
      setIsSettingsOpen(false);

      // If slug changed, we need to redirect to the new URL
      const currentUrl = window.location.pathname;
      const urlParts = currentUrl.split("/");
      const oldSlug = urlParts[urlParts.length - 1];

      if (formData.slug !== oldSlug && formData.slug) {
        urlParts[urlParts.length - 1] = formData.slug;
        router.push(urlParts.join("/"));
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Update note failed", error);
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="py-12 px-4 space-y-10 border-b border-dashed mb-8 sm:mb-16">
      {/* --- TITLE & META --- */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {note.name}
          </h1>

          <div className="flex items-center gap-2 shrink-0 pt-2">
            {showEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border bg-background/50 backdrop-blur-sm">
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="gap-2">
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsCollaboratorsOpen(true)} className="gap-2">
                    <Users className="size-4" />
                    Manage Collaborators
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onEdit} className="gap-2 text-primary focus:text-primary">
                    <Pencil className="size-4" />
                    Edit Content
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {showEdit && onEdit && (
              <Button
                onClick={onEdit}
                variant="default"
                size="lg"
                className="rounded-full px-6 shadow-lg shadow-primary/20"
              >
                <Pencil className="size-4 mr-2" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
            <Calendar className="size-4" />
            <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
            <Clock className="size-4" />
            <span>Updated {formatTimeAgo(new Date(note.contentUpdatedAt))}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1 rounded-full">
            <Hash className="size-4" />
            <span>{readingTime} min read</span>
          </div>
          {showVisibility && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border",
              note.visibility === "public" ? "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400" : "bg-destructive/5 border-destructive/20 text-destructive"
            )}>
              {note.visibility === "public" ? <Globe className="size-4" /> : <Lock className="size-4" />}
              <span className="capitalize">{note.visibility}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- AUTHOR & COLLABORATORS --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
        <Link
          href={`/${author?.userName}`}
          className="flex flex-row items-center w-max gap-4 group transition-all"
        >
          <div className="relative size-14 shrink-0 rounded-full p-1 border-2 border-primary/10 group-hover:border-primary/30 transition-all">
            <div className="relative size-full rounded-full overflow-hidden">
              <CloudinaryImage
                src={author.avatar || "/avatar.svg"}
                alt={author?.fullName || "Author"}
                fill
                sizes="56px"
                className="object-cover transition-transform group-hover:scale-105"
                preload
                fetchPriority="high"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="font-bold flex gap-2 items-center text-lg text-foreground leading-tight">
              <span>{author?.fullName}</span>
              {author?.role === "admin" && (
                <BadgeIcon className="size-5 text-blue-500" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              @{author?.userName}
            </span>
          </div>
        </Link>

        {/* Collaborators List */}
        {(note.collaborators && note.collaborators.length > 0) && (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
              onClick={() => setIsCollaboratorsOpen(true)}
            >
              <div className="flex -space-x-3 overflow-hidden">
                {(note.collaborators as IUser[]).map((col, i) => (
                  <TooltipWrapper key={col._id || i} message={col.fullName}>
                    <div className="inline-block relative size-10 rounded-full border-2 border-background ring-1 ring-primary/5 overflow-hidden bg-muted transition-transform group-hover:scale-105">
                      <Image
                        src={col.avatar || "/avatar.svg"}
                        alt={col.fullName || "Collaborator"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  </TooltipWrapper>
                ))}
              </div>
            </div>
        )}
      </div>

      {/* --- DIALOGS --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note Settings</DialogTitle>
            <DialogDescription>
              Update your note&apos;s basic information and visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between space-x-2 border rounded-md p-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {formData.visibility === "public" ? (
                    <Globe className="size-4 text-primary" />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" />
                  )}
                  <Label className="text-sm font-medium">Public Access</Label>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formData.visibility === "public" 
                    ? "Anyone with the link can view this note." 
                    : "Only you and collaborators can view this note."}
                </p>
              </div>
              <Switch
                checked={formData.visibility === "public"}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visibility: checked ? "public" : "private" }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Note title..."
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setManualSlug(false);
                    setFormData(prev => ({ ...prev, slug: slugify(formData.name) }));
                  }} 
                  tooltip="Auto-generate slug from title"
                  className={cn(!manualSlug && "text-primary bg-primary/5 border-primary/20")}
                >
                  <Hash className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Custom Slug</Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
                    setFormData(prev => ({ ...prev, slug: val }));
                    setManualSlug(true);
                  }}
                  placeholder="url-friendly-slug"
                  className={cn(
                    "pr-10",
                    isSlugAvailable === true && formData.slug !== note.slug && "border-green-500/50 focus-visible:ring-green-500/20",
                    isSlugAvailable === false && "border-red-500/50 focus-visible:ring-red-500/20"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isCheckingSlug ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : formData.slug && formData.slug !== note.slug ? (
                    isSlugAvailable === true ? (
                      <Check className="size-4 text-green-500" />
                    ) : isSlugAvailable === false ? (
                      <X className="size-4 text-red-500" />
                    ) : null
                  ) : null}
                </div>
              </div>
              {isSlugAvailable === false && (
                <p className="text-[10px] font-medium text-red-500 ml-1">
                  This slug is already taken in this collection.
                </p>
              )}
              <p className="text-[10px] text-muted-foreground px-1">
                Changing the slug will change the URL of this note.
              </p>
            </div>

          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleUpdateNote} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseCollaboratorsDialog
        open={isCollaboratorsOpen}
        onOpenChange={setIsCollaboratorsOpen}
        type="note"
        targetId={note._id}
        currentCollaborators={note.collaborators as IUser[]}
        closeDialog={() => setIsCollaboratorsOpen(false)}
        updateNoteCollaborators={updateNoteCollaborators}
        updateCollectionCollaborators={async () => { }} // Not used here
        isSaving={status.collaborator.state === "saving"}
      />
    </div>
  );
}
