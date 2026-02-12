// src/context/CollaboratorManagerContext.tsx
"use client";
import { createContext, useContext, useState } from "react";

type DialogType = "collection" | "note";

export type CollaboratorManagerContextValue = {
  currentCollaborators: unknown[];
  targetId: string | null;
  type: DialogType | null;
  isDialogOpen: boolean;
  openDialog: (collaborators: unknown[], id: string, dialogType: DialogType) => void;
  closeDialog: () => void;
};

const CollaboratorManagerContext =
  createContext<CollaboratorManagerContextValue | null>(null);

export const CollaboratorManagerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentCollaborators, setCurrentCollaborators] = useState<unknown[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [type, setType] = useState<DialogType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog: CollaboratorManagerContextValue["openDialog"] = (
    collaborators,
    id,
    dialogType,
  ) => {
    setCurrentCollaborators(collaborators || []);
    setTargetId(id);
    setType(dialogType);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    // Small delay to allow animations to complete before resetting
    setTimeout(() => {
      setCurrentCollaborators([]);
      setTargetId(null);
      setType(null);
    }, 300);
  };

  return (
    <CollaboratorManagerContext.Provider
      value={{
        currentCollaborators,
        targetId,
        type,
        isDialogOpen,
        openDialog,
        closeDialog,
      }}
    >
      {children}
    </CollaboratorManagerContext.Provider>
  );
};

export const useCollaboratorManager = () => {
  const context = useContext(CollaboratorManagerContext);
  if (!context) {
    throw new Error(
      "useCollaboratorManager must be used within a CollaboratorManagerProvider.",
    );
  }
  return context;
};