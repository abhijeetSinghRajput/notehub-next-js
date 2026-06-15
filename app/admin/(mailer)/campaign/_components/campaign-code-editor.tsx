"use client";

import { Badge } from "@/components/ui/badge";
import {
  TabbedCodeEditor,
  EditorTab,
} from "../../template/_components/tabbed-code-editor";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

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
        errors.push({
          message: `Entry [${i}] is missing a valid "email" field`,
        });
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

// ─── Extract liquid variable paths from HTML ────────────────────────────────

type Skeleton = Record<string, unknown>;

/**
 * Merge a dot-path (e.g. ["user","email"]) into a skeleton object,
 * creating nested objects as needed. Leaf values default to "".
 */
function setPath(root: Skeleton, path: string[]) {
  let node = root;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i === path.length - 1;
    if (isLast) {
      if (!(key in node)) node[key] = "";
    } else {
      if (
        typeof node[key] !== "object" ||
        node[key] === null ||
        Array.isArray(node[key])
      ) {
        node[key] = {};
      }
      node = node[key] as Skeleton;
    }
  }
}

/**
 * Find all dot-paths starting with `prefix.` (e.g. "blog.") in the given
 * text, returning the remainder paths split into segments.
 * e.g. for prefix "blog", "{{ blog.collectionId.name }}" -> ["collectionId","name"]
 */
function findPaths(text: string, prefix: string): string[][] {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const paths: string[][] = [];

  // {{ prefix.a.b.c }} or {{ prefix.a.b.c | filter }}
  const printRe = new RegExp(
    `{{\\s*${escaped}((?:\\.[a-zA-Z_][a-zA-Z0-9_]*)+)\\s*(?:\\|[^}]*)?}}`,
    "g",
  );
  // {% if/elsif/for/unless ... prefix.a.b.c ... %}
  const tagRe = new RegExp(
    `{%[^%]*?\\b${escaped}((?:\\.[a-zA-Z_][a-zA-Z0-9_]*)+)`,
    "g",
  );

  let match: RegExpExecArray | null;
  while ((match = printRe.exec(text)) !== null) {
    paths.push(match[1].slice(1).split("."));
  }
  while ((match = tagRe.exec(text)) !== null) {
    paths.push(match[1].slice(1).split("."));
  }

  return paths;
}

/**
 * Extract the body of each {% for alias in source %} ... {% endfor %} block,
 * returning [alias, source, bodyText][]. Handles nested loops by tracking
 * depth per alias.
 */
function findForLoops(html: string): { alias: string; source: string; body: string }[] {
  const loops: { alias: string; source: string; body: string }[] = [];
  const forRe = /{%-?\s*for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s*-?%}/g;

  let match: RegExpExecArray | null;
  while ((match = forRe.exec(html)) !== null) {
    const [fullMatch, alias, source] = match;
    const startIdx = match.index + fullMatch.length;

    // Walk forward tracking nested for/endfor to find the matching endfor
    const tagRe = /{%-?\s*(for|endfor)\b[^%]*-?%}/g;
    tagRe.lastIndex = startIdx;
    let depth = 1;
    let endIdx = -1;
    let t: RegExpExecArray | null;
    while ((t = tagRe.exec(html)) !== null) {
      if (t[1] === "for") depth++;
      else depth--;
      if (depth === 0) {
        endIdx = t.index;
        break;
      }
    }

    const body = endIdx !== -1 ? html.slice(startIdx, endIdx) : "";
    loops.push({ alias, source, body });
  }

  return loops;
}

export function extractExtraStructure(htmlBody: string): Skeleton[] {
  const root: Skeleton = {};

  // 1. Find all for-loops over extra.* — these define array fields
  const loops = findForLoops(htmlBody);
  const arrayPaths = new Set<string>(); // e.g. "blogs"

  for (const { alias, source, body } of loops) {
    if (!source.startsWith("extra.")) continue;

    const arrayPath = source.slice("extra.".length); // e.g. "blogs"
    arrayPaths.add(arrayPath);

    // Build item skeleton from <alias>.* references inside the loop body
    const itemPaths = findPaths(body, alias);
    const itemSkeleton: Skeleton = {};
    for (const p of itemPaths) setPath(itemSkeleton, p);

    // Ensure email-bearing arrays still work generically:
    // place the array skeleton at its nested location in root
    setPath(root, arrayPath.split(".")); // ensure parent objects exist
    const segs = arrayPath.split(".");
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) {
      node = node[segs[i]] as Skeleton;
    }
    const lastKey = segs[segs.length - 1];
    node[lastKey] = [Object.keys(itemSkeleton).length > 0 ? itemSkeleton : ""];
  }

  // 2. Find all top-level extra.* references NOT inside an array's for-loop body
  //    (to avoid double-counting paths already captured as array items)
  let scalarHtml = htmlBody;
  for (const { body } of loops) {
    scalarHtml = scalarHtml.replace(body, "");
  }

  const topPaths = findPaths(scalarHtml, "extra");
  for (const p of topPaths) {
    const rootKey = p[0];
    if (arrayPaths.has(rootKey) || arrayPaths.has(p.join("."))) continue;
    // skip if this path's root is already an array we built
    if (Array.isArray(root[rootKey])) continue;
    setPath(root, p);
  }

  return [{ email: "recipient_1@gmail.com", ...root }];
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
  const isJsonEmpty = extraJson.trim() === "{}" || extraJson.trim() === "";
  const handleGenerateStructure = () => {
    const structure = extractExtraStructure(htmlBody);
    onJsonChange(JSON.stringify(structure, null, 2));
    onTabChange("json");
  };

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
          ? {
              loading: previewBuilding,
              disabled: !htmlBody.trim(),
              onClick: onPreview,
            }
          : undefined
      }
      statusBar={(tab) => {
        if (tab !== "json") return null;

        const showWand = isJsonEmpty && htmlBody.includes("extra.");

        return (
          <div className="flex gap-2 justify-between border-t bg-muted/20">
            {jsonErrors.length === 0 || showWand ? (
              <div className="px-3 py-1.5 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  {jsonErrors.length === 0 && (
                    <>
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
                    </>
                  )}
                </div>

                {showWand && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleGenerateStructure}
                  >
                    <Wand2 className="mr-1 w-3 h-3" />
                    Generate from HTML
                  </Button>
                )}
              </div>
            ) : null}
            
            {jsonErrors.length > 0 ? (
              <div className="space-y-1 w-full bg-destructive/5 px-3 py-2 border-b border-destructive/30">
                {jsonErrors.map((e, i) => (
                  <p key={i} className="text-destructive text-xs font-mono">
                    ❌ {e.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        );
      }}
    />
  );
}
