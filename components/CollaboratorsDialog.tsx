// src > pages > collection > CollaboratorsDialog
"use client"
import { useAuthStore } from "@/app/stores/useAuthStore";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollaboratorManager } from "@/contex/CollaboratorManagerContext";
import { cn } from "@/lib/utils";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Loader2, Search, X } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { IUser } from "@/types/model";

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const CollaboratorsDialog: React.FC = () => {
  const { currentCollaborators, targetId, type, isDialogOpen, closeDialog } =
    useCollaboratorManager();

  const { updateNoteCollaborators, updateCollectionCollaborators, status } =
    useNoteStore();
  if (!isDialogOpen) return null;

  return (
    <BaseCollaboratorsDialog
      open={isDialogOpen}
      onOpenChange={closeDialog}
      currentCollaborators={currentCollaborators as IUser[]}
      targetId={targetId as string}
      type={type as "collection" | "note"}
      closeDialog={closeDialog}
      updateNoteCollaborators={updateNoteCollaborators}
      updateCollectionCollaborators={updateCollectionCollaborators}
      isSaving={status.collaborator.state === "saving"}
    />
  );
};

interface BaseCollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCollaborators: IUser[];
  targetId: string;
  type: "collection" | "note";
  closeDialog: () => void;
  updateNoteCollaborators: (data: { noteId: string; collaborators: IUser[] }) => Promise<void>;
  updateCollectionCollaborators: (data: { collectionId: string; collaborators: IUser[] }) => Promise<void>;
  isSaving: boolean;
}

const BaseCollaboratorsDialog = ({
  open,
  onOpenChange,
  currentCollaborators,
  targetId,
  type,
  closeDialog,
  updateNoteCollaborators,
  updateCollectionCollaborators,
  isSaving,
}: BaseCollaboratorsDialogProps) => {
  const [workingCollaborators, setWorkingCollaborators] = useState(() => [
    ...currentCollaborators,
  ]);
  const [removedIds, setRemovedIds] = useState(() => new Set());

  const onAddCollaborator = (user: IUser) => {
    setWorkingCollaborators((prev) => [user, ...prev]);
    setRemovedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(user._id);
      return newSet;
    });
  };

  const onRemoveCollaborator = (userId: string) => {
    setRemovedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(userId);
      return newSet;
    });
  };

  const onRestoreCollaborator = (userId: string) => {
    setRemovedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const onSave = useCallback(async () => {
    if (!targetId || !type) return;

    try {
      const finalCollaborators = workingCollaborators
        .filter((user) => !removedIds.has(user._id))
        .map((user) => user._id);

      if (type === "note") {
        await updateNoteCollaborators({
          noteId: targetId as string,
          collaborators: finalCollaborators as unknown as IUser[],
        });
      } else {
        await updateCollectionCollaborators({
          collectionId: targetId,
          collaborators: finalCollaborators as unknown as IUser[],
        });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to update collaborators:", error);
    }
  }, [
    closeDialog,
    removedIds,
    targetId,
    type,
    updateCollectionCollaborators,
    updateNoteCollaborators,
    workingCollaborators,
  ]);

  const hasChanges =
    removedIds.size > 0 ||
    workingCollaborators.length !== currentCollaborators.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Manage Collaborators</DialogTitle>
          <DialogDescription>
            Add or remove people who can access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SearchBar
            onUserSelect={onAddCollaborator}
            currentCollaborators={workingCollaborators}
          />

          <CollaboratorsList
            collaborators={workingCollaborators}
            removedIds={removedIds as Set<string>}
            onRemove={onRemoveCollaborator}
            onRestore={onRestoreCollaborator}
          />
        </div>

        <CardFooter className="flex justify-end p-0 pt-4">
          <Button onClick={onSave} disabled={!hasChanges || isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SearchBarProps {
  onUserSelect: (user: IUser) => void;
  currentCollaborators: IUser[];
}

const SearchBar: React.FC<SearchBarProps> = ({ onUserSelect, currentCollaborators }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { authUser, getAllUsers } = useAuthStore();

  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await getAllUsers({
          page: 1,
          limit: 10,
          filter: "all",
          search: query,
        });

        // Filter out current collaborators and auth user
        const filteredUsers = response.users.filter(
          (user: IUser) =>
            user._id !== authUser?._id &&
            !currentCollaborators.some((c) => c._id === user._id),
        );

        setSearchResults(filteredUsers);
      } finally {
        setIsSearching(false);
      }
    },
    [currentCollaborators, authUser?._id, getAllUsers],
  );

  useEffect(() => {
    searchUsers(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchUsers]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleUserSelect = (user: IUser) => {
    onUserSelect(user);
    handleClearSearch();
  };

  return (
    <div className="relative space-y-1">
      <Label className="mb-2">Search by username, full name, or email</Label>
      <div className="relative">
        <Search className="text-muted-foreground absolute size-4 left-2 top-1/2 -translate-y-1/2" />
        <Input
          className="px-8"
          placeholder="Find people"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {(searchQuery || isSearching) && (
          <Button
            tooltip="clear search"
            size="icon"
            variant="ghost"
            className="text-muted-foreground absolute size-8 p-0 hover:bg-transparent right-0 top-1/2 -translate-y-1/2"
            disabled={isSearching}
            onClick={handleClearSearch}
            aria-label="Clear Search"
          >
            {isSearching ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <X className="size-4" />
            )}
          </Button>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="absolute z-50  top-[calc(100%+4px)] bg-background p-1 w-full border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="p-2 hover:bg-muted/50 cursor-pointer rounded-sm"
              onClick={() => handleUserSelect(user)}
            >
              <UserInfo user={user} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface CollaboratorsListProps {
  collaborators: IUser[];
  removedIds: Set<string>;
  onRemove: (userId: string) => void;
  onRestore: (userId: string) => void;
}

const CollaboratorsList = ({
  collaborators,
  removedIds,
  onRemove,
  onRestore,
}: CollaboratorsListProps) => {
  if (collaborators.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No collaborators yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {collaborators.map((user: IUser) => {
        const isRemoved = removedIds.has(user._id);
        return (
          <Card
            key={user._id}
            className="p-2 flex flex-row items-center justify-between"
          >
            <UserInfo user={user} className={isRemoved ? "opacity-50" : ""} />
            <Button
              size="sm"
              variant={isRemoved ? "default" : "secondary"}
              onClick={() =>
                isRemoved ? onRestore(user._id) : onRemove(user._id)
              }
            >
              {isRemoved ? "Undo" : "Remove"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
};

interface UserInfoProps {
  user: IUser;
  className?: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ user, className = "" }) => (
  <div className={cn("flex gap-2 items-center", className)}>
    <Avatar className="size-10">
      <AvatarImage
        width={100}
        height={100}
        src={user.avatar}
        alt={user.fullName || "User Profile Photo"}
      />
      <AvatarFallback>{user.fullName[0].toUpperCase()}</AvatarFallback>
    </Avatar>
    <div>
      <div className="font-medium flex gap-1.5 items-center justify-between">
        {user.fullName}
        {user.role === "admin" && (
          <BadgeIcon className="size-3.5 text-blue-500" />
        )}
      </div>
      <div className="text-muted-foreground text-xs">@{user.userName}</div>
    </div>
  </div>
);
