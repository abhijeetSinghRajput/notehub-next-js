"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Unlink,
  ArrowUpRight,
  Globe,
  ExternalLink,
  Copy,
  Download,
} from "lucide-react";
import { CopyMdDialog } from "@/components/admin/CopyMdDialog";
import { ExportCsvDialog } from "@/components/admin/ExportCsvDialog";
import { cn } from "@/lib/utils";
import type { ILinkGraphCrawl, IGraphNode } from "@/types/linkGraph.types";
import Link from "next/link";
import { BrokenLinksPanel } from "./BrokenLinksPanel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// ── Shared node row used by orphans, dead ends, http tabs ─────────────────────
function NodeRow({
  node,
  icon: Icon,
  iconClass,
  countLabel,
}: {
  node: IGraphNode;
  icon: React.ElementType;
  iconClass: string;
  countLabel?: string;
}) {
  const href = node.fullPath ? `/${node.fullPath}` : null;

  return (
    <div className="px-4 py-2.5 border-b flex items-center gap-3 group">
      <Icon className={cn("h-4 w-4 shrink-0", iconClass)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {node.title || `/${node.slug}`}
        </div>
        {href ? (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="truncate">{href}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ) : (
          <div className="font-mono text-xs text-muted-foreground">
            /{node.slug}
          </div>
        )}
      </div>
      {countLabel && (
        <div className="ml-auto text-xs tabular-nums text-muted-foreground shrink-0">
          {countLabel}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function LinkReportPanel({ crawl }: { crawl: ILinkGraphCrawl }) {
  if (!crawl) return null;

  const [copyMdOpen, setCopyMdOpen] = useState(false);
  const [exportCsvOpen, setExportCsvOpen] = useState(false);

  const brokenCount = crawl.brokenLinks?.length ?? 0;
  const orphanNodes = crawl.nodes?.filter((n) => n.isOrphan) ?? [];
  const deadEndNodes = crawl.nodes?.filter((n) => n.isDeadEnd) ?? [];
  const httpNodes = crawl.nodes?.filter((n) => n.hasHttp) ?? [];

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Tabs defaultValue={brokenCount > 0 ? "broken" : "orphans"}>
        <TabsList variant="line" className="bg-accent w-full">
          <TabsTrigger value="broken" className="text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Broken
              <span className="ml-1 text-muted-foreground">{brokenCount}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="orphans" className="text-xs">
            <div className="flex items-start gap-2">
              <Unlink className="h-4 w-4 text-warn" />
              Orphans
              <span className="ml-1 text-muted-foreground">
                {orphanNodes.length}
              </span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="deadends" className="text-xs">
            <div className="flex items-start gap-2">
              <ArrowUpRight className="h-4 w-4 text-purple-500" />
              Dead ends
              <span className="ml-1 text-muted-foreground">
                {deadEndNodes.length}
              </span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="http" className="text-xs">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-cyan-500" />
              HTTP
              <span className="ml-1 text-muted-foreground">
                {httpNodes.length}
              </span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* ── Broken — uses BrokenLinksPanel as the content ── */}
        <TabsContent value="broken" className="p-0">
          <ScrollArea className="h-56">
            <BrokenLinksPanel crawl={crawl} />
          </ScrollArea>
        </TabsContent>

        {/* ── Orphans ── */}
        <TabsContent value="orphans" className="p-0">
          <ScrollArea className="h-56">
            {orphanNodes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No orphan notes.
              </div>
            )}
            {orphanNodes.map((n) => (
              <NodeRow
                key={n.noteId}
                node={n}
                icon={Unlink}
                iconClass="text-warn"
                countLabel={
                  n.incomingCount > 0 ? `${n.incomingCount} in` : undefined
                }
              />
            ))}
          </ScrollArea>
        </TabsContent>

        {/* ── Dead ends ── */}
        <TabsContent value="deadends" className="p-0">
          <ScrollArea className="h-56">
            {deadEndNodes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No dead-end notes.
              </div>
            )}
            {deadEndNodes.map((n) => (
              <NodeRow
                key={n.noteId}
                node={n}
                icon={ArrowUpRight}
                iconClass="text-purple-500"
                countLabel={
                  n.outgoingCount > 0 ? `${n.outgoingCount} out` : undefined
                }
              />
            ))}
          </ScrollArea>
        </TabsContent>

        {/* ── HTTP ── */}
        <TabsContent value="http" className="p-0">
          <ScrollArea className="h-56">
            {httpNodes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No notes with HTTP links.
              </div>
            )}
            {httpNodes.map((n) => (
              <NodeRow
                key={n.noteId}
                node={n}
                icon={Globe}
                iconClass="text-cyan-500"
                countLabel={
                  n.outgoingCount > 0 ? `${n.outgoingCount} out` : undefined
                }
              />
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <div className="p-2 sticky bottom-0 bg-accent bordert-t flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 hover:bg-primary/5 border-dashed w-22 h-7 font-semibold hover:text-primary text-xs transition-colors shrink-0"
          onClick={() => setCopyMdOpen(true)}
        >
          <Copy className="h-3.5 w-3.5" /> Copy MD
        </Button>
        <Button
          size="sm"
          variant={"outline"}
          className="gap-1 hover:bg-primary/5 border-dashed w-22 h-7 font-semibold hover:text-primary text-xs transition-colors shrink-0"
          onClick={() => setExportCsvOpen(true)}
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      <CopyMdDialog
        open={copyMdOpen}
        onOpenChange={setCopyMdOpen}
        crawl={crawl}
      />
      <ExportCsvDialog
        open={exportCsvOpen}
        onOpenChange={setExportCsvOpen}
        crawl={crawl}
      />
    </div>
  );
}
