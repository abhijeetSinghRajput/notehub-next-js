"use client";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet } from "lucide-react";
import type { ILinkGraphCrawl } from "@/types/linkGraph.types";

// ── Section keys ──────────────────────────────────────────────────────────────
type SectionKey = "broken" | "orphans" | "deadends" | "http";

const SECTIONS: { key: SectionKey; label: string; description: string }[] = [
  { key: "broken",   label: "Broken links",     description: "Source slug + unresolved href" },
  { key: "orphans",  label: "Orphan notes",      description: "Notes with no incoming links" },
  { key: "deadends", label: "Dead end notes",    description: "Notes with no outgoing links" },
  { key: "http",     label: "HTTP link notes",   description: "Notes containing http:// links" },
];

// ── CSV builders ──────────────────────────────────────────────────────────────
function escapeCell(value: string | number | boolean): string {
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildRow(cells: (string | number | boolean)[]): string {
  return cells.map(escapeCell).join(",");
}

function buildBrokenCsv(crawl: ILinkGraphCrawl): string {
  const rows = ["Source Slug,Source Full Path,Broken Href"];
  crawl.brokenLinks?.forEach((bl) => {
    const sourceNode = crawl.nodes?.find((n) => n.slug === bl.fromSlug);
    const fullPath = sourceNode?.fullPath ? `/${sourceNode.fullPath}` : "";
    rows.push(buildRow([
      bl.fromSlug ?? "unknown",
      fullPath,
      bl.href,
    ]));
  });
  return rows.join("\n");
}

function buildOrphansCsv(crawl: ILinkGraphCrawl): string {
  const rows = ["Title,Slug,Full Path,Outgoing Links"];
  crawl.nodes
    ?.filter((n) => n.isOrphan)
    .forEach((n) => {
      rows.push(buildRow([
        n.title ?? "",
        n.slug,
        n.fullPath ? `/${n.fullPath}` : "",
        n.outgoingCount,
      ]));
    });
  return rows.join("\n");
}

function buildDeadEndsCsv(crawl: ILinkGraphCrawl): string {
  const rows = ["Title,Slug,Full Path,Incoming Links"];
  crawl.nodes
    ?.filter((n) => n.isDeadEnd)
    .forEach((n) => {
      rows.push(buildRow([
        n.title ?? "",
        n.slug,
        n.fullPath ? `/${n.fullPath}` : "",
        n.incomingCount,
      ]));
    });
  return rows.join("\n");
}

function buildHttpCsv(crawl: ILinkGraphCrawl): string {
  const rows = ["Title,Slug,Full Path,Outgoing Links"];
  crawl.nodes
    ?.filter((n) => n.hasHttp)
    .forEach((n) => {
      rows.push(buildRow([
        n.title ?? "",
        n.slug,
        n.fullPath ? `/${n.fullPath}` : "",
        n.outgoingCount,
      ]));
    });
  return rows.join("\n");
}

const CSV_BUILDERS: Record<SectionKey, (crawl: ILinkGraphCrawl) => string> = {
  broken:   buildBrokenCsv,
  orphans:  buildOrphansCsv,
  deadends: buildDeadEndsCsv,
  http:     buildHttpCsv,
};

// ── Download helper ───────────────────────────────────────────────────────────
function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
interface ExportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crawl: ILinkGraphCrawl;
}

export function ExportCsvDialog({ open, onOpenChange, crawl }: ExportCsvDialogProps) {
  const [selected, setSelected] = useState<Set<SectionKey>>(
    new Set(["broken", "orphans", "deadends", "http"])
  );

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

  // Row counts for each section — shown as hint next to label
  const counts: Record<SectionKey, number> = {
    broken:   crawl.brokenLinks?.length ?? 0,
    orphans:  crawl.nodes?.filter((n) => n.isOrphan).length ?? 0,
    deadends: crawl.nodes?.filter((n) => n.isDeadEnd).length ?? 0,
    http:     crawl.nodes?.filter((n) => n.hasHttp).length ?? 0,
  };

  function handleExport() {
    const crawledAt = (crawl.completedAt ?? crawl.createdAt ?? "")
      .slice(0, 10); // YYYY-MM-DD

    if (selected.size === 1) {
      // Single section → one file
      const [key] = [...selected] as [SectionKey];
      const csv = CSV_BUILDERS[key](crawl);
      downloadCsv(csv, `notehub-${key}-${crawledAt}.csv`);
    } else {
      // Multiple sections → one file per section, staggered by 80ms so
      // browsers don't suppress duplicate download dialogs
      [...selected].forEach((key, i) => {
        setTimeout(() => {
          const csv = CSV_BUILDERS[key as SectionKey](crawl);
          downloadCsv(csv, `notehub-${key}-${crawledAt}.csv`);
        }, i * 80);
      });
    }

    onOpenChange(false);
  }

  const totalRows = [...selected].reduce(
    (sum, key) => sum + counts[key as SectionKey],
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </DialogTitle>
          <DialogDescription>
            Each selected section exports as a separate CSV file.
          </DialogDescription>
        </DialogHeader>

        {/* Section checkboxes */}
        <div className="space-y-1 py-1">
          {/* Select all */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="export-select-all"
              checked={allChecked}
              data-state={someChecked ? "indeterminate" : allChecked ? "checked" : "unchecked"}
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="export-select-all" className="cursor-pointer font-medium text-sm">
              All sections
            </Label>
          </div>

          <Separator className="my-1" />

          {SECTIONS.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`export-${key}`}
                checked={selected.has(key)}
                onCheckedChange={() => toggle(key)}
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={`export-${key}`} className="cursor-pointer text-sm">
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                {counts[key]} rows
              </span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        {selected.size > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            {selected.size} file{selected.size > 1 ? "s" : ""} · {totalRows} total rows
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selected.size === 0} className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export {selected.size > 1 ? `${selected.size} files` : "CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}