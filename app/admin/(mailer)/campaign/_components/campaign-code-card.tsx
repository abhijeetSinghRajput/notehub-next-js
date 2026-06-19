"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { json as jsonLang } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export default function CampaignCodeCard({
  json: jsonData,
  html,
}: {
  json: unknown;
  html: string;
}) {
  const jsonString = JSON.stringify(jsonData ?? {}, null, 2);
  const [tab, setTab] = useState<"html" | "json">("html");
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = () => {
    copy(
      tab === "json" ? jsonString : html,
      tab === "json" ? "JSON copied" : "HTML copied",
    );
  };

  const isEmpty = tab === "json" ? !jsonData || jsonString === "{}" : !html;

  return (
    <div className="flex flex-col border rounded-md max-h-60 overflow-hidden">
      <div className="sticky top-0 flex items-center justify-between bg-[#222222] border-b border-[#444] px-2 text-xs text-muted-foreground">
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

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-[#444] bg-[#303030] hover:bg-[#323232] text-[#a1a1a1] hover:text-white"
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

      {isEmpty ? (
        <p className="p-4 text-center text-muted-foreground text-sm">
          No {tab} data
        </p>
      ) : (
        <div className="flex-1 overflow-auto text-xs">
          <CodeMirror
            value={tab === "json" ? jsonString : html}
            theme={oneDark}
            extensions={[tab === "json" ? jsonLang() : htmlLang()]}
            editable={false}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
            }}
          />
        </div>
      )}
    </div>
  );
}
