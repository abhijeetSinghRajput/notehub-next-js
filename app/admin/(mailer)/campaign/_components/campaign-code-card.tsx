"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import hljs from "highlight.js";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("xml", xml);

export default function CampaignCodeCard({ json: jsonData, html }: { json: unknown; html: string }) {
  const jsonString = JSON.stringify(jsonData ?? {}, null, 2);
  const [tab, setTab] = useState<"html" | "json">("html");
  const [copied, setCopied] = useState(false);

  const highlightedJson = hljs.highlight(jsonString, { language: "json" }).value;
  const highlightedHtml = hljs.highlight(html ?? "", { language: "xml" }).value;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tab === "json" ? jsonString : html);
      setCopied(true);
      toast.success(tab === "json" ? "JSON copied" : "HTML copied");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const isEmpty =
    tab === "json"
      ? !jsonData || jsonString === "{}"
      : !html;

  return (
    <div className="flex flex-col border rounded-md max-h-60 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between bg-[#222222] border-b border-[#444] px-2 text-xs text-muted-foreground">
        {/* Tabs */}
        <div className="flex">
          {(["html", "json"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-3 py-3 font-medium transition-colors uppercase tracking-wide",
                tab === t
                  ? "text-white border-b-2 border-white"
                  : "text-muted-foreground hover:text-white",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-[#444]  bg-[#303030] hover:bg-[#323232] text-[#a1a1a1] hover:text-white"
          onClick={handleCopy}
          tooltip={`copy ${tab}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Content */}
      {isEmpty ? (
        <p className="p-4 text-center text-muted-foreground text-sm">
          No {tab} data
        </p>
      ) : (
        <pre
          className="flex-1 bg-[#181818] p-3 overflow-auto font-mono text-white text-xs break-all leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: tab === "json" ? highlightedJson : highlightedHtml,
          }}
        />
      )}
    </div>
  );
}