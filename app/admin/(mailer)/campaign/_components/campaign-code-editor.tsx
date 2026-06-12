"use client";

import { Badge } from "@/components/ui/badge";
import { TabbedCodeEditor, EditorTab } from "../../template/_components/tabbed-code-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JsonError {
  message: string;
}

// ─── JSON validation ──────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateExtraJson(raw: string): {
  errors: JsonError[];
  isPerRecipient: boolean;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      errors: [{ message: `Invalid JSON: ${(e as Error).message}` }],
      isPerRecipient: false,
    };
  }

  if (Array.isArray(parsed)) {
    const errors: JsonError[] = [];
    (parsed as unknown[]).forEach((entry, i) => {
      if (typeof entry !== "object" || entry === null) {
        errors.push({ message: `Entry [${i}] must be an object` });
        return;
      }
      const e = entry as Record<string, unknown>;
      if (typeof e.email !== "string" || !EMAIL_RE.test(e.email)) {
        errors.push({ message: `Entry [${i}] is missing a valid "email" field` });
      }
    });
    return { errors, isPerRecipient: true };
  }

  if (typeof parsed === "object" && parsed !== null) {
    return { errors: [], isPerRecipient: false };
  }

  return {
    errors: [{ message: "Extra JSON must be an object { } or an array [ ]" }],
    isPerRecipient: false,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CampaignCodeEditorProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;

  htmlBody: string;
  onHtmlChange: (value: string) => void;

  extraJson: string;
  onJsonChange: (value: string) => void;

  jsonErrors: JsonError[];
  isPerRecipient: boolean;
  recipientCount: number;

  previewBuilding?: boolean;
  onPreview?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CampaignCodeEditor({
  activeTab,
  onTabChange,
  htmlBody,
  onHtmlChange,
  extraJson,
  onJsonChange,
  jsonErrors,
  isPerRecipient,
  recipientCount,
  previewBuilding,
  onPreview,
}: CampaignCodeEditorProps) {
  return (
    <TabbedCodeEditor
      activeTab={activeTab}
      onTabChange={onTabChange}
      htmlBody={htmlBody}
      onHtmlChange={onHtmlChange}
      extraJson={extraJson}
      onJsonChange={onJsonChange}
      jsonHasErrors={jsonErrors.length > 0}
      previewButton={
        onPreview
          ? { loading: previewBuilding, disabled: !htmlBody.trim(), onClick: onPreview }
          : undefined
      }
      statusBar={(tab) => {
        if (tab !== "json") return null;

        if (jsonErrors.length > 0) {
          return (
            <div className="space-y-1 bg-destructive/5 px-3 py-2 border-t border-destructive/30">
              {jsonErrors.map((e, i) => (
                <p key={i} className="text-destructive text-xs font-mono">
                  ❌ {e.message}
                </p>
              ))}
            </div>
          );
        }

        return (
          <div className="px-3 py-1.5 border-t bg-muted/20 flex items-center gap-2">
            <Badge
              variant={isPerRecipient ? "default" : "secondary"}
              className="text-xs"
            >
              {isPerRecipient
                ? `per-recipient · ${recipientCount} unique email${recipientCount !== 1 ? "s" : ""}`
                : "shared object"}
            </Badge>
            {isPerRecipient && (
              <span className="text-muted-foreground text-xs">
                Recipients list driven by this JSON
              </span>
            )}
          </div>
        );
      }}
    />
  );
}