"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ChooseCollection from "./addNote/ChooseCollection";
import CreateCollection from "./addNote/CreateCollection";
import AddNote from "./addNote/AddNote";
import { ICollection } from "@/types/model";

type AddNoteDrawerProps = {
  trigger: ReactNode;
};

const AddNoteDrawer = ({ trigger }: AddNoteDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ICollection | null>(null);
  const [activeTab, setActiveTab] = useState("choose-collection");

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setActiveTab("choose-collection");
          setSelectedCollection(null);
        }
      }}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <DrawerTitle className="sr-only">Add note to collection</DrawerTitle>
        <DrawerDescription className="sr-only">
          Choose or create a collection, then add a new note.
        </DrawerDescription>
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
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
      </DrawerContent>
    </Drawer>
  );
};

export default AddNoteDrawer;