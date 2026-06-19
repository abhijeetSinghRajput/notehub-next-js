"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Globe,
  Lock,
  Pencil,
  MoreHorizontal,
  Users,
  Check,
  Hash,
  TextCursor,
  Loader2,
  X,
  Settings,
  Trash2,
  Copy,
} from "lucide-react";
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
import { useState, useMemo, useEffect, useCallback } from "react";
import { htmlToMarkdown } from "@/lib/note/htmlToMarkdown.client";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { BaseCollaboratorsDialog } from "../CollaboratorsDialog";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

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
  const { updateNote, updateNoteCollaborators, status, deleteNote } =
    useNoteStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { copied: isMdCopied, copy } = useCopyToClipboard();

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
        const collectionId =
          typeof note.collectionId === "string"
            ? note.collectionId
            : (note.collectionId as { _id: string })?._id;
        if (!collectionId) return;

        const res = await axiosInstance.get(
          `/note/check-availability?collectionId=${collectionId}&slug=${formData.slug}&noteId=${note._id}`,
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

  const handleCopyMarkdown = useCallback(() => {
    const md = `# ${note.name}\n\n${htmlToMarkdown(note.content)}`;

    copy(md, "Markdown copied");
  }, [note.name, note.content, copy]);

  return (
    <div className="space-y-10 mb-8 sm:mb-16 px-4 py-12 border-b border-dashed">
      {/* --- TITLE & META --- */}
      <div className="space-y-4">
        <h1 className="font-bold text-foreground text-3xl sm:text-4xl leading-tight tracking-tight">
          {note.name}
        </h1>
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-medium text-muted-foreground text-xs">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
              <Calendar className="size-4" />
              <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
              <Clock className="size-4" />
              <span>
                Updated {formatTimeAgo(new Date(note.contentUpdatedAt))}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full text-primary">
              <Hash className="size-4" />
              <span>{readingTime} min read</span>
            </div>
            {showVisibility && (
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 border rounded-full",
                  note.visibility === "public"
                    ? "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-destructive/5 border-destructive/20 text-destructive",
                )}
              >
                {note.visibility === "public" ? (
                  <Globe className="size-4" />
                ) : (
                  <Lock className="size-4" />
                )}
                <span className="capitalize">{note.visibility}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/50 backdrop-blur-sm border rounded-full w-10 h-10"
                  >
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setIsSettingsOpen(true)}
                    className="gap-2"
                  >
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsCollaboratorsOpen(true)}
                    className="gap-2"
                  >
                    <Users />
                    Manage Collaborators
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onEdit}
                    className="gap-2 text-primary focus:text-primary"
                  >
                    <Pencil />
                    Edit Content
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* --- AUTHOR & COLLABORATORS --- */}
      <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-6 pt-2">
        <div className="flex justify-between items-center gap-3 w-full">
          <Link
            href={`/${author?.userName}`}
            className="group flex flex-row items-center gap-4 w-max transition-all"
          >
            <div className="relative p-1 border-2 border-primary/10 group-hover:border-primary/30 rounded-full size-14 transition-all shrink-0">
              <div className="relative rounded-full size-full overflow-hidden">
                <CloudinaryImage
                  src={author.avatar || "/avatar.svg"}
                  alt={author?.fullName || "Author"}
                  fill
                  sizes="56px"
                  className="object-cover group-hover:scale-105 transition-transform"
                  preload
                  fetchPriority="high"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-bold text-foreground text-lg leading-tight">
                <span>{author?.fullName}</span>
                {author?.role === "admin" && (
                  <BadgeIcon className="size-5 text-blue-500" />
                )}
              </div>
              <span className="text-muted-foreground text-sm">
                @{author?.userName}
              </span>
            </div>
          </Link>

          {/* Copy MD button */}
          <Button
            onClick={handleCopyMarkdown}
            aria-label="Copy note as Markdown"
            tooltip="Copy note as Markdown"
            size="sm"
            variant={"outline"}
            className="gap-1 hover:bg-primary/5 border-dashed w-22 h-7 font-semibold hover:text-primary text-xs transition-colors shrink-0"
          >
            {isMdCopied ? (
              <>
                <Check className="size-3 text-emerald-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy MD
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Collaborators List */}
      {note.collaborators && note.collaborators.length > 0 && (
        <div
          className="group flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => setIsCollaboratorsOpen(true)}
        >
          <div className="flex -space-x-3 overflow-hidden">
            {(note.collaborators as IUser[]).map((col, i) => (
              <TooltipWrapper key={col._id || i} message={col.fullName}>
                <div className="inline-block relative bg-muted border-2 border-background rounded-full ring-1 ring-primary/5 size-10 overflow-hidden group-hover:scale-105 transition-transform">
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
            <div className="flex justify-between items-center space-x-2 p-3 border rounded-md">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {formData.visibility === "public" ? (
                    <Globe className="size-4 text-primary" />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" />
                  )}
                  <Label className="font-medium text-sm">Public Access</Label>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formData.visibility === "public"
                    ? "Anyone with the link can view this note."
                    : "Only you and collaborators can view this note."}
                </p>
              </div>
              <Switch
                checked={formData.visibility === "public"}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    visibility: checked ? "public" : "private",
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Note title..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setManualSlug(false);
                    setFormData((prev) => ({
                      ...prev,
                      slug: slugify(formData.name),
                    }));
                  }}
                  tooltip="Auto-generate slug from title"
                  className={cn(
                    !manualSlug &&
                      "text-primary bg-primary/5 border-primary/20",
                  )}
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
                    const val = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-");
                    setFormData((prev) => ({ ...prev, slug: val }));
                    setManualSlug(true);
                  }}
                  placeholder="url-friendly-slug"
                  className={cn(
                    "pr-10",
                    isSlugAvailable === true &&
                      formData.slug !== note.slug &&
                      "border-green-500/50 focus-visible:ring-green-500/20",
                    isSlugAvailable === false &&
                      "border-red-500/50 focus-visible:ring-red-500/20",
                  )}
                />
                <div className="top-1/2 right-3 absolute flex items-center gap-1.5 -translate-y-1/2">
                  {isCheckingSlug ? (
                    <Loader2 className="size-4 text-muted-foreground animate-spin" />
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
                <p className="ml-1 font-medium text-[10px] text-red-500">
                  This slug is already taken in this collection.
                </p>
              )}
              <p className="px-1 text-[10px] text-muted-foreground">
                Changing the slug will change the URL of this note.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsSettingsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateNote} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              note.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsSaving(true);
                try {
                  await deleteNote(note._id);
                  setIsDeleteDialogOpen(false);
                  const currentUrl = window.location.pathname;
                  const urlParts = currentUrl.split("/");
                  urlParts.pop(); // remove noteSlug
                  router.push(urlParts.join("/"));
                } catch (error) {
                  console.error("Delete failed", error);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete"}
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
        updateCollectionCollaborators={async () => {}} // Not used here
        isSaving={status.collaborator.state === "saving"}
      />
    </div>
  );
}
