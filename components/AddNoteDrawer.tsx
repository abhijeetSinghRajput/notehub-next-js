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
import { motion, AnimatePresence } from "framer-motion";
import { ICollection } from "@/types/model";

type AddNoteDrawerProps = {
  trigger: ReactNode;
};

const AddNoteDrawer = ({ trigger }: AddNoteDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ICollection | null>(null);
  const [activeTab, setActiveTab] = useState("choose-collection");
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: string) => {
    const tabs = ["choose-collection", "create-collection", "add-note"];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);

    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -30 : 30,
      opacity: 0,
    }),
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        // Reset internal state when drawer closes (no effect needed)
        if (!nextOpen) {
          setActiveTab("choose-collection");
          setDirection(0);
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
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
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
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddNoteDrawer;
