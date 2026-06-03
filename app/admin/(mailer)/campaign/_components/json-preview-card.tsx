"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import hljs from "highlight.js";

export default function JsonPreviewCard({ json }: { json: unknown }) {
  const jsonString = JSON.stringify(json ?? {}, null, 2);

  const highlighted = hljs.highlight(jsonString, {
    language: "json",
  }).value;
  const [copied, setCopied] = useState(false);

  const handleCopyExtraJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);

      setCopied(true);
      toast.success("Extra JSON copied");

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      toast.error("Failed to copy JSON");
    }
  };

  return (
    <div className="flex flex-col border rounded-md max-h-60 overflow-hidden">
      <div className="top-0 sticky flex items-center justify-between bg-[#222222] p-2 border-[#444] border-b text-muted-foreground text-xs">
        <span>Extra Data (JSON)</span>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopyExtraJson}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {json && json !== "{}" ? (
        <pre
          className="flex-1 bg-[#181818] p-3 overflow-auto font-mono text-white text-xs break-all leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <p className="p-4 text-center text-muted-foreground text-sm">
          No extra data
        </p>
      )}
    </div>
  );
}
