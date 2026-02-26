"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ChooseCollection from "./addNote/ChooseCollection";
import CreateCollection from "./addNote/CreateCollection";
import AddNote from "./addNote/AddNote";
import { ICollection } from "@/types/model";

type AddNoteDialogProps = {
  trigger: ReactNode;
};

const AddNoteDialog = ({ trigger }: AddNoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ICollection | null>(null);
  const [activeTab, setActiveTab] = useState("choose-collection");

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setActiveTab("choose-collection");
          setSelectedCollection(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="h-[80vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Add note to collection</DialogTitle>
        <DialogDescription className="sr-only">
          Choose or create a collection, then add a new note.
        </DialogDescription>
        <div className="mx-auto h-full min-h-0 w-full overflow-y-auto">
          {activeTab === "choose-collection" ? (
            <ChooseCollection
              setActiveTab={handleTabChange}
              setSelectedCollection={setSelectedCollection}
            />
          ) : activeTab === "create-collection" ? (
            <CreateCollection
              setActiveTab={handleTabChange}
              setSelectedCollection={setSelectedCollection}
            />
          ) : (
            <AddNote
              setOpen={setOpen}
              setActiveTab={handleTabChange}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteDialog;