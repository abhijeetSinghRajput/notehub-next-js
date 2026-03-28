import React, { useCallback, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, FolderOutput,
  Lock,
  LockOpen,
  Pencil,
  Trash2,
  UserPlus2
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNoteStore } from "@/app/stores/useNoteStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCollaboratorManager } from "@/contex/CollaboratorManagerContext";
import { cn } from "@/lib/utils";
import AvatarStack from "./CollaboratorAvatars";
import { Badge } from "@/components/ui/badge";
import FolderIcon from "./icons/FolderIcon";
import { INote } from "@/types/model";

type NotesOptionProps = {
  trigger: React.ReactNode;
  note: INote;
  setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
};

const NotesOption = React.memo<NotesOptionProps>(
  ({ trigger, note, setIsRenaming, className }) => {
    const { collections, moveTo, deleteNote, updateNoteVisibility, status } =
      useNoteStore();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { openDialog } = useCollaboratorManager();

    const filteredCollections = useMemo(() => {
      return collections.filter((c) => String(c._id) !== String(note.collectionId));
    }, [collections, note.collectionId]);

    const handleMove = useCallback(
      async (collectionId: string) => {
        await moveTo({ collectionId, noteId: note._id });
        setIsMoveDialogOpen(false);
      },
      [moveTo, note._id],
    );

    const handleDelete = useCallback(() => {
      deleteNote(note._id);
      setIsDeleteDialogOpen(false);
    }, [deleteNote, note._id]);

    const toggleVisibility = useCallback(() => {
      const newVisibility = note.visibility === "public" ? "private" : "public";
      updateNoteVisibility({
        visibility: newVisibility,
        noteId: note._id,
      });
    }, [note.visibility, note._id, updateNoteVisibility]);

    const dropdownItems = useMemo(
      () => [
        {
          id: "rename",
          icon: <Pencil className="size-4 text-muted-foreground" />,
          label: "Rename",
          onClick: () => {
            setIsRenaming(true);
            setDropdownOpen(false);
          },
        },
        {
          id: "visibility",
          icon:
            note.visibility === "public" ? (
              <Lock className="size-4 text-muted-foreground" />
            ) : (
              <LockOpen className="size-4 text-muted-foreground" />
            ),
          label: note.visibility === "public" ? "Make Private" : "Make Public",
          onClick: toggleVisibility,
        },
        {
          id: "move",
          icon: <FolderOutput className="size-4 text-muted-foreground" />,
          label: "Move to",
          onClick: () => {
            setIsMoveDialogOpen(true);
            setDropdownOpen(false);
          },
        },
        {
          id: "collaborators",
          icon: <UserPlus2 className="size-4 text-muted-foreground" />,
          label: "Collaborators",
          onClick: () => {
            openDialog(note?.collaborators || [], note?._id, "note");
            setDropdownOpen(false);
          },
        },
        {
          id: "delete",
          icon: <Trash2 className="size-4 text-destructive" />,
          label: "Delete Note",
          onClick: () => {
            setIsDeleteDialogOpen(true);
            setDropdownOpen(false);
          },
          className:
            "font-normal p-2 h-auto w-full justify-start gap-2 text-destructive hover:bg-red-400/20 hover:text-destructive",
        },
      ],
      [
        note.visibility,
        note._id,
        note.collaborators,
        openDialog,
        toggleVisibility,
        setIsRenaming,
      ],
    );

    return (
      <>
        {/* Move Dialog */}
        <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
          <DialogContent className="sm:max-w-lg p-1 overflow-hidden bg-muted rounded-2xl!">
            <div className="flex flex-col h-full">
              <Command className="rounded-xl bg-background/70 border-none">
                <div className="border-b-2">
                  <CommandInput placeholder="Search collections..." autoFocus />
                </div>
                <CommandList className="min-h-[50svh] overflow-y-auto">
                  <CommandEmpty>No collections found</CommandEmpty>
                  <CommandGroup>
                    {filteredCollections.map((collection, index) => (
                      <CommandItem
                        key={collection._id ? String(collection._id) : index}
                        value={collection.name}
                        onSelect={() => handleMove(String(collection._id))}
                        className="group flex cursor-pointer items-center gap-4 border-b p-3 rounded-none transition-all hover:bg-muted/50 hover:shadow-sm"
                      >
                        <FolderIcon className="size-12" />

                        <div className="flex-1">
                          <h4 className="font-semibold group-hover:text-primary">
                            {collection.name}
                          </h4>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs text-muted-foreground"
                              >
                                {collection.notes?.length} notes
                              </Badge>
                              {collection.visibility === "private" && (
                                <Badge
                                  variant="destructive"
                                  className="size-5 p-0 flex items-center justify-center"
                                >
                                  <Lock strokeWidth={3} size={15} />
                                </Badge>
                              )}
                            </div>
                            {collection.collaborators?.length > 0 && (
                              <AvatarStack
                                size="sm"
                                collaborators={collection.collaborators as any}
                              />
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-transform" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader className={"text-left"}>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                note.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={"flex flex-row gap-2 ml-auto"}>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dropdown Menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label="Open note options menu"
              className={cn(
                "shrink-0 p-1 size-6 text-muted-foreground hover:text-foreground",
                className,
              )}
            >
              {trigger}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {dropdownItems.slice(0, 4).map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={item.onClick}
                className="gap-2"
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={dropdownItems[4].onClick}
              className={dropdownItems[4].className}
            >
              {dropdownItems[4].icon}
              {dropdownItems[4].label}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  },
);

NotesOption.displayName = "NotesOption";

export default NotesOption;
