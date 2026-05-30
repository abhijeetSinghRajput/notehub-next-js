"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, FileText } from "lucide-react";
import type { ILinkGraphCrawl } from "@/types/linkGraph.types";

// ── Section keys ──────────────────────────────────────────────────────────────
type SectionKey = "summary" | "broken" | "isolated" | "orphans" | "deadends" | "http";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "summary",  label: "Summary stats" },
  { key: "broken",   label: "Broken links" },
  { key: "isolated",   label: "Isolated links" },
  { key: "orphans",  label: "Orphan notes" },
  { key: "deadends", label: "Dead end notes" },
  { key: "http",     label: "HTTP link notes" },
];

// ── Markdown builders ─────────────────────────────────────────────────────────
function buildMarkdown(crawl: ILinkGraphCrawl, selected: Set<SectionKey>): string {
  const lines: string[] = [];
  const crawledAt = crawl.completedAt
    ? new Date(crawl.completedAt).toLocaleString()
    : new Date(crawl.createdAt).toLocaleString();

  lines.push(`# NoteHub Link Graph Report`);
  lines.push(`> Crawled at: ${crawledAt}\n`);

  // ── Summary ────────────────────────────────────────────────────────────────
  if (selected.has("summary") && crawl.summary) {
    const s = crawl.summary;
    lines.push(`## Summary\n`);
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total notes | ${s.totalNotes} |`);
    lines.push(`| Total edges | ${s.totalEdges} |`);
    lines.push(`| Orphan notes | ${s.orphanCount} |`);
    lines.push(`| Dead end notes | ${s.deadEndCount} |`);
    lines.push(`| Broken links | ${s.brokenLinkCount} |`);
    lines.push(`| HTTP link notes | ${s.httpLinkCount} |`);
    lines.push("");
  }

  // ── Broken links ───────────────────────────────────────────────────────────
  if (selected.has("broken") && crawl.brokenLinks?.length) {
    lines.push(`## Broken Links (${crawl.brokenLinks.length})\n`);
    lines.push(`| Source article | Broken href |`);
    lines.push(`|----------------|-------------|`);
    crawl.brokenLinks.forEach((bl) => {
      const source = bl.fromSlug ? `/${bl.fromSlug}` : "unknown";
      lines.push(`| \`${source}\` | \`${bl.href}\` |`);
    });
    lines.push("");
  }

  // ── Isolated links ───────────────────────────────────────────────────────────
  if (selected.has("isolated")) {
    const isolated = crawl.nodes?.filter((n) => n.isIsolated) ?? [];
    if (isolated.length) {
      lines.push(`## Isolated Notes (${isolated.length})\n`);
      lines.push(`> These notes have no incoming internal links.\n`);
      lines.push(`| Title | Path |`);
      lines.push(`|-------|------|`);
      isolated.forEach((n) => {
        const path = n.fullPath ? `/${n.fullPath}` : `/${n.slug}`;
        lines.push(`| ${n.title || n.slug} | \`${path}\` |`);
      });
      lines.push("");
    }
  }

  // ── Orphans ────────────────────────────────────────────────────────────────
  if (selected.has("orphans")) {
    const orphans = crawl.nodes?.filter((n) => n.isOrphan) ?? [];
    if (orphans.length) {
      lines.push(`## Orphan Notes (${orphans.length})\n`);
      lines.push(`> These notes have no incoming internal links.\n`);
      lines.push(`| Title | Path |`);
      lines.push(`|-------|------|`);
      orphans.forEach((n) => {
        const path = n.fullPath ? `/${n.fullPath}` : `/${n.slug}`;
        lines.push(`| ${n.title || n.slug} | \`${path}\` |`);
      });
      lines.push("");
    }
  }

  // ── Dead ends ──────────────────────────────────────────────────────────────
  if (selected.has("deadends")) {
    const deadEnds = crawl.nodes?.filter((n) => n.isDeadEnd) ?? [];
    if (deadEnds.length) {
      lines.push(`## Dead End Notes (${deadEnds.length})\n`);
      lines.push(`> These notes have no outgoing internal links.\n`);
      lines.push(`| Title | Path | Incoming |`);
      lines.push(`|-------|------|----------|`);
      deadEnds.forEach((n) => {
        const path = n.fullPath ? `/${n.fullPath}` : `/${n.slug}`;
        lines.push(`| ${n.title || n.slug} | \`${path}\` | ${n.incomingCount} |`);
      });
      lines.push("");
    }
  }

  // ── HTTP ───────────────────────────────────────────────────────────────────
  if (selected.has("http")) {
    const httpNotes = crawl.nodes?.filter((n) => n.hasHttp) ?? [];
    if (httpNotes.length) {
      lines.push(`## Notes with HTTP Links (${httpNotes.length})\n`);
      lines.push(`> These notes contain plain \`http://\` links instead of \`https://\`.\n`);
      lines.push(`| Title | Path |`);
      lines.push(`|-------|------|`);
      httpNotes.forEach((n) => {
        const path = n.fullPath ? `/${n.fullPath}` : `/${n.slug}`;
        lines.push(`| ${n.title || n.slug} | \`${path}\` |`);
      });
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────
interface CopyMdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crawl: ILinkGraphCrawl;
}

export function CopyMdDialog({ open, onOpenChange, crawl }: CopyMdDialogProps) {
  const [selected, setSelected] = useState<Set<SectionKey>>(
    new Set(["summary", "broken", "isolated", "orphans", "deadends", "http"])
  );
  const [copied, setCopied] = useState(false);

  const allChecked = selected.size === SECTIONS.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(SECTIONS.map((s) => s.key)));
  }

  function toggle(key: SectionKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const markdown = useMemo(() => buildMarkdown(crawl, selected), [crawl, selected]);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Copy as Markdown
          </DialogTitle>
          <DialogDescription>
            Select sections to include in the report.
          </DialogDescription>
        </DialogHeader>

        {/* Section checkboxes */}
        <div className="space-y-1 py-1">
          {/* Select all */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="select-all"
              checked={allChecked}
              // indeterminate state via data attr for styling
              data-state={someChecked ? "indeterminate" : allChecked ? "checked" : "unchecked"}
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="cursor-pointer font-medium text-sm">
              All sections
            </Label>
          </div>

          <Separator className="my-1" />

          {SECTIONS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`section-${key}`}
                checked={selected.has(key)}
                onCheckedChange={() => toggle(key)}
              />
              <Label htmlFor={`section-${key}`} className="cursor-pointer text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-lg border bg-muted/30">
          <div className="px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Preview</p>
          </div>
          <ScrollArea className="h-36">
            <pre className="p-3 text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {markdown || "No sections selected."}
            </pre>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={selected.size === 0} className="gap-2">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Markdown
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}