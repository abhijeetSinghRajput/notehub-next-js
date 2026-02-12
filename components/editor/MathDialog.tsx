import React, { useCallback, useEffect, useRef, useState } from "react";
import "mathlive";
import type { Editor } from "@tiptap/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Sigma,
  Trash2,
} from "lucide-react";
import ToggleSwitch from "../ToggleSwitch";
import { useEditorStore } from "@/app/stores/useEditorStore";

// Type declaration for math-field JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          value?: string;
          onInput?: (evt: Event) => void;
        },
        HTMLElement
      >;
    }
  }
}

const displayModes = [
  { label: "inline", value: "inline", icon: AlignHorizontalSpaceAround },
  { label: "block", value: "block", icon: AlignVerticalSpaceAround },
];

export default function MathDialog({ editor }: { editor: Editor }) {
  const { openMathDialog, closeDialog, openDialog } = useEditorStore();
  const [latex, setLatex] = useState("");
  const [editMode, setEditMode] = useState<string | null>("inline"); // 'inline' or 'block'
  const [pos, setPos] = useState<number | null>(null);

  // handler when external click (from extension) opens the dialog
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const {
        latex: initialLatex = "",
        pos: nodePos = null,
        mode = "inline",
      } = customEvent.detail || {};
      setLatex(initialLatex);
      setPos(nodePos);
      setEditMode(mode);
      openDialog("openMathDialog");
    };

    window.addEventListener("open-math-dialog", handler);
    return () => window.removeEventListener("open-math-dialog", handler);
  }, []);

  const insertMath = () => {
    if (!latex || !editor) return;
    if (pos != null) {
      // editing an existing node
      const node = editor.state.doc.nodeAt(pos);
      if (!node) return;
      const isBlock = node.type.name === "blockMath";

      if (editMode === "block") {
        if (!isBlock) {
          // replace inline math with block math
          editor
            .chain()
            .setNodeSelection(pos)
            .deleteInlineMath()
            .insertBlockMath({ latex })
            .focus()
            .run();
        } else {
          editor
            .chain()
            .setNodeSelection(pos)
            .updateBlockMath({ latex })
            .focus()
            .run();
        }
      } else if (editMode === "inline") {
        if (isBlock) {
          // replace block math with inline math
          editor
            .chain()
            .setNodeSelection(pos)
            .deleteBlockMath()
            .insertInlineMath({ latex })
            .focus()
            .run();
        } else {
          editor
            .chain()
            .setNodeSelection(pos)
            .updateInlineMath({ latex })
            .focus()
            .run();
        }
      }
    } else {
      // inserting new node
      if (editMode === "block") {
        editor.chain().focus().insertBlockMath({ latex }).run();
      } else {
        editor.chain().focus().insertInlineMath({ latex }).run();
      }
    }

    closeDialog("openMathDialog");
  };

  const deleteMath = () => {
    if (!editor || pos == null) return;

    const node = editor.state.doc.nodeAt(pos);
    const isBlock = node?.type.name === "blockMath";

    if (isBlock) {
      editor.chain().setNodeSelection(pos).deleteBlockMath().focus().run();
    } else {
      editor.chain().setNodeSelection(pos).deleteInlineMath().focus().run();
    }

    closeDialog("openMathDialog");
  };

  const handleCancel = () => {
    closeDialog("openMathDialog");

    // reset after close
    setLatex("");
    setEditMode("inline");
    setPos(null);
  };

  return (
    <Dialog open={openMathDialog}>
      <DialogTrigger asChild>
        <Button
          tooltip="Equation"
          aria-label="open equation dialog"
          size="icon"
          variant="outline"
          onClick={() => {
            // If user manually opens the dialog via button, we treat it as insert (no edit)
            setEditMode("inline");
            setPos(null);
            setLatex("");
            openDialog("openMathDialog");
          }}
        >
          <Sigma />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl" closeButtonClassName="hidden">
        <DialogHeader
          className={"flex flex-row w-full gap-4 justify-between items-center"}
        >
          <DialogTitle className="text-left">
            {editMode ? "Edit" : "Insert"} Equation
          </DialogTitle>
          <ToggleSwitch
            className="w-full"
            options={displayModes.map(({ label, value, icon }) => ({ label, value, icon: React.createElement(icon) }))}
            value={editMode || "inline"}
            onChange={(val) => setEditMode(val as string)}
          />
        </DialogHeader>

        {/* @ts-ignore */}
        {React.createElement("math-field", {
          onInput: (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            setLatex(target.value);
          },
          className: "w-full border border-border rounded-md overflow-x-auto px-3 py-2 text-2xl bg-muted/30 text-primary ring-offset-2 ring-offset-background focus-within::outline-none focus-within::ring-2 focus-within::ring-ring focus:outline-none focus:ring-2 focus:ring-ring",
          value: latex,
        }, latex)}
        {/* @ts-ignore */}

        <DialogFooter className={"justify-between"}>
          <Button variant="destructive" onClick={deleteMath}>
            <Trash2 /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={insertMath}>
              {editMode ? "Update" : "Insert"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
