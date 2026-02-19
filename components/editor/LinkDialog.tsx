import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ExternalLink, LinkIcon, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { useEditorStore } from "@/app/stores/useEditorStore";
import { isValidUrl } from "@/lib/validator";

export function LinkDialog({ editor }: { editor: Editor }) {
  const { openLinkDialog, closeDialog, openDialog } = useEditorStore();

  const [linkUrl, setLinkUrl] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial link value when dialog opens
  useEffect(() => {
    if (openLinkDialog && editor) {
      const currentLink = editor.getAttributes("link").href || "";
      setLinkUrl(currentLink);
      setIsValid(currentLink === "" || isValidUrl(currentLink));
      setShowError(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [openLinkDialog, editor]);

  const handleSetLink = () => {
    if (!editor) return;
    let finalUrl = linkUrl.trim();
    
    // If empty, remove link
    if (!finalUrl) {
      editor.chain().focus().unsetLink().run();
      closeDialog("openLinkDialog");
      return;
    }
    
    // Validate URL
    if (!isValidUrl(finalUrl)) {
      setShowError(true);
      return;
    }
    
    // Add protocol if missing
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`;
    }

    editor.chain().focus().setLink({ href: finalUrl }).run();
    setShowError(false);
    closeDialog("openLinkDialog");
  };

  const handleRemoveLink = () => {
    if (!editor) return;

    editor.chain().focus().unsetLink().run();
    setLinkUrl("");
    closeDialog("openLinkDialog");
  };

  const handleOpenLink = () => {
    if (linkUrl) {
      window.open(linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!editor) return null;

  return (
    <Dialog
      open={openLinkDialog}
      onOpenChange={(open) =>
        open ? openDialog("openLinkDialog") : closeDialog("openLinkDialog")
      }
    >
      <DialogTrigger asChild>
        <Button
          tooltip="Insert Link"
          size="icon"
          variant="ghost"
          onClick={() => openDialog("openLinkDialog")}
          disabled={!editor.can().setLink({ href: "" })}
          aria-label="Insert Link"
        >
          <LinkIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add Link</DialogTitle>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Paste link"
              value={linkUrl}
              onChange={(e) => {
                const value = e.target.value;
                setLinkUrl(value);
                // Validate on each change
                setIsValid(value.trim() === "" || isValidUrl(value.trim()));
                setShowError(false); // Hide error while typing
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSetLink();
                if (e.key === "Escape") closeDialog("openLinkDialog");
              }}
              className={showError ? "ring ring-destructive focus-visible:ring-destructive" : ""}
            />
            <div className="flex gap-1">
              <Button
                tooltip="Open Link"
                aria-label="Open Link"
                variant="secondary"
                size="icon"
                onClick={handleOpenLink}
                disabled={!linkUrl || !isValid}
              >
                <ExternalLink />
              </Button>
              <Button
                tooltip="Remove Link"
                aria-label="Remove Link"
                variant="secondary"
                size="icon"
                onClick={handleRemoveLink}
                disabled={!editor.getAttributes("link").href}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          {showError && (
            <p className="text-xs text-destructive">Please enter a valid URL (e.g., example.com or https://example.com)</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
