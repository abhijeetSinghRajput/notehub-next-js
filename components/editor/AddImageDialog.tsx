import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ImagePlusIcon } from "lucide-react";
import FileDropZone from "../FileDropZone";
import { useEditorStore } from "@/app/stores/useEditorStore";

const AddImageDialog = ({ editor }: { editor: Editor }) => {
  const { openImageDialog, closeDialog, openDialog } = useEditorStore();

  const handleSetImage = useCallback(
    (url: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      closeDialog("openImageDialog");
    },
    [editor],
  );

  return (
    <Dialog
      open={openImageDialog}
      onOpenChange={(open) =>
        open ? openDialog("openImageDialog") : closeDialog("openImageDialog")
      }
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" tooltip="Insert Image">
          <ImagePlusIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle className="hidden">Add Image</DialogTitle>
        <FileDropZone onImageSelect={handleSetImage} />
      </DialogContent>
    </Dialog>
  );
};

export default AddImageDialog;
