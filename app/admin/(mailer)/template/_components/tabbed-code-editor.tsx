"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Code2, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";

// ─── Stable extension references (must live outside component) ────────────────

export const HTML_EXTENSIONS = [html()];
export const JSON_EXTENSIONS = [json()];

const BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  highlightActiveLine: true,
  autocompletion: true,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditorTab = "html" | "json";

interface TabbedCodeEditorProps {
  /** Currently active tab */
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;

  /** HTML editor */
  htmlBody: string;
  onHtmlChange: (value: string) => void;

  /** JSON editor */
  extraJson: string;
  onJsonChange: (value: string) => void;

  /**
   * Height of the CodeMirror editors.
   * @default "400px"
   */
  editorHeight?: string;

  /**
   * Show a red dot on the JSON tab when true (e.g. validation errors present).
   */
  jsonHasErrors?: boolean;

  /**
   * Optional preview button in the tab bar.
   * Pass `undefined` to hide it entirely.
   */
  previewButton?: {
    loading?: boolean;
    disabled?: boolean;
    onClick: () => void;
  };

  /**
   * Content rendered below the editor (status bars, error banners, badges…).
   * Receives the active tab so callers can conditionally show per-tab content.
   */
  statusBar?: (activeTab: EditorTab) => ReactNode;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: EditorTab; label: string; icon: ReactNode }[] = [
  { id: "html", label: "email.html", icon: <Code2 className="w-3.5 h-3.5" /> },
  { id: "json", label: "extra.json", icon: <Braces className="w-3.5 h-3.5" /> },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TabbedCodeEditor({
  activeTab,
  onTabChange,
  htmlBody,
  onHtmlChange,
  extraJson,
  onJsonChange,
  editorHeight = "400px",
  jsonHasErrors = false,
  previewButton,
  statusBar,
}: TabbedCodeEditorProps) {
  return (
    <div className="flex flex-col border rounded-md overflow-hidden">
      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b bg-muted/30">
        <div className="flex items-center px-1 pt-1 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-t-sm transition-colors border border-transparent select-none",
                activeTab === tab.id
                  ? "bg-background border-border border-b-background text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "json" && jsonHasErrors && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
              )}
            </button>
          ))}
        </div>

        {previewButton && (
          <Button
            size="icon"
            variant="outline"
            className="size-7 mr-2"
            onClick={previewButton.onClick}
            disabled={previewButton.loading || previewButton.disabled}
            title="Show Preview"
          >
            {previewButton.loading ? (
              <Loader2 className="animate-spin w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* ── Editors ─────────────────────────────────────────────────────────── */}
      {activeTab === "html" ? (
        <CodeMirror
          value={htmlBody}
          onChange={onHtmlChange}
          extensions={HTML_EXTENSIONS}
          theme={oneDark}
          height={editorHeight}
          className="text-sm"
          basicSetup={BASIC_SETUP}
        />
      ) : (
        <CodeMirror
          value={extraJson}
          onChange={onJsonChange}
          extensions={JSON_EXTENSIONS}
          theme={oneDark}
          height={editorHeight}
          className="text-sm"
          basicSetup={BASIC_SETUP}
        />
      )}

      {/* ── Status bar slot ──────────────────────────────────────────────────── */}
      {statusBar?.(activeTab)}
    </div>
  );
}