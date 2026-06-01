"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PreviewSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  previews: { label: string; html: string }[];
  subject: string;
}
const PreviewSheet = ({
  open,
  onOpenChange,
  previews,
  subject,
}: PreviewSheetProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const current = previews[index];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 w-full sm:max-w-2xl"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex justify-between items-center">
            <SheetTitle className="font-medium text-sm">Preview</SheetTitle>
            {previews.length > 1 && (
              <div className="flex items-center gap-1 pr-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-7 h-7"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="w-16 text-muted-foreground text-xs text-center">
                  {current?.label}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-7 h-7"
                  disabled={index === previews.length - 1}
                  onClick={() => setIndex((i) => i + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {previews.length > 1 && (
            <p className="text-muted-foreground text-xs">
              {index + 1} of {previews.length} recipients
            </p>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <div className="p-2 font-normal text-muted-foreground">
            {subject || "No subject"}
          </div>
          {current ? (
            <iframe
              key={index}
              srcDoc={current.html}
              className="border-0 w-full h-full"
              title="Email preview"
            />
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground text-sm">
              No preview available
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PreviewSheet;
