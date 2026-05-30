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
  Ban,
} from "lucide-react";
import { CopyMdDialog } from "@/components/admin/CopyMdDialog";
import { ExportCsvDialog } from "@/components/admin/ExportCsvDialog";
import { cn } from "@/lib/utils";
import type { ILinkGraphCrawl, IGraphNode } from "@/types/linkGraph.types";
import Link from "next/link";
import { BrokenLinksPanel } from "./BrokenLinksPanel";
import { useRef, useState } from "react";
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
            <span className="truncate sm:hidden">{node.slug}</span>
            <span className="truncate hidden sm:inline">{href}</span>
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

export const NoInComming = ({className, size=30} : {className ?: string; size ?: number}) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_146_47)">
    <path d="M18.84 12.25L20.56 10.54H20.54C21.4606 9.58603 21.9651 8.30572 21.9426 6.98017C21.9201 5.65461 21.3725 4.39216 20.42 3.46999C19.4869 2.57019 18.2412 2.06738 16.945 2.06738C15.6488 2.06738 14.4031 2.57019 13.47 3.46999L11.75 5.17999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.16994 11.75L3.45994 13.46C2.53931 14.414 2.03486 15.6943 2.05736 17.0198C2.07986 18.3454 2.62746 19.6078 3.57994 20.53C4.51299 21.4298 5.7587 21.9326 7.05494 21.9326C8.35118 21.9326 9.59689 21.4298 10.5299 20.53L12.2399 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.72336 0.309524C1.34202 -0.0899739 0.709023 -0.104695 0.309524 0.276644C-0.0899739 0.657984 -0.104695 1.29098 0.276644 1.69048L1 1L1.72336 0.309524ZM21.9767 23.9997C22.5289 24.0126 22.9869 23.5754 22.9997 23.0233L23.209 14.0257C23.2218 13.4735 22.7846 13.0155 22.2325 13.0027C21.6804 12.9899 21.2224 13.427 21.2095 13.9792L21.0235 21.977L13.0257 21.791C12.4735 21.7782 12.0155 22.2154 12.0027 22.7675C11.9899 23.3196 12.427 23.7776 12.9792 23.7905L21.9767 23.9997ZM1 1L0.276644 1.69048L21.2766 23.6905L22 23L22.7234 22.3095L1.72336 0.309524L1 1Z" fill="currentColor"/>
    </g>
    <defs>
    <clipPath id="clip0_146_47">
    <rect width="24" height="24" fill="currentColor"/>
    </clipPath>
    </defs>
  </svg>
);

export const NoOutgoing = ({className, size=30} : {className ?: string; size ?: number}) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_146_62)">
    <path d="M18.84 12.25L20.56 10.54H20.54C21.4606 9.58603 21.9651 8.30572 21.9426 6.98017C21.9201 5.65461 21.3725 4.39216 20.42 3.46999C19.4869 2.57019 18.2412 2.06738 16.945 2.06738C15.6488 2.06738 14.4031 2.57019 13.47 3.46999L11.75 5.17999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.16994 11.75L3.45994 13.46C2.53931 14.414 2.03486 15.6943 2.05736 17.0198C2.07986 18.3454 2.62746 19.6078 3.57994 20.53C4.51299 21.4298 5.7587 21.9326 7.05494 21.9326C8.35118 21.9326 9.59689 21.4298 10.5299 20.53L12.2399 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.02325 0.000270307C0.471114 -0.01257 0.0131107 0.424615 0.000270307 0.97675L-0.208976 9.97432C-0.221816 10.5265 0.215369 10.9845 0.767504 10.9973C1.31964 11.0101 1.77764 10.573 1.79048 10.0208L1.97648 2.02298L9.97432 2.20898C10.5265 2.22182 10.9845 1.78463 10.9973 1.2325C11.0101 0.68036 10.573 0.222357 10.0208 0.209516L1.02325 0.000270307ZM21.2766 23.6905C21.658 24.09 22.291 24.1047 22.6905 23.7234C23.09 23.342 23.1047 22.709 22.7234 22.3095L22 23L21.2766 23.6905ZM1 1L0.276644 1.69048L21.2766 23.6905L22 23L22.7234 22.3095L1.72336 0.309524L1 1Z" fill="currentColor"/>
    </g>
    <defs>
    <clipPath id="clip0_146_62">
    <rect width="24" height="24" fill="currentColor"/>
    </clipPath>
    </defs>
  </svg>
);

export function LinkReportPanel({ crawl }: { crawl: ILinkGraphCrawl }) {
  if (!crawl) return null;

  const [copyMdOpen, setCopyMdOpen] = useState(false);
  const [exportCsvOpen, setExportCsvOpen] = useState(false);

  const brokenCount = crawl.brokenLinks?.length ?? 0;
  const orphanNodes = crawl.nodes?.filter((n) => n.isOrphan) ?? [];
  const deadEndNodes = crawl.nodes?.filter((n) => n.isDeadEnd) ?? [];
  const httpNodes = crawl.nodes?.filter((n) => n.hasHttp) ?? [];
  const isolatedNodes = crawl.nodes?.filter((n) => n.isIsolated) ?? [];

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const scrollToTab = (value: string) => {
    const el = tabRefs.current[value];

    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Tabs
        defaultValue={brokenCount > 0 ? "broken" : "orphans"}
        onValueChange={scrollToTab}
      >
        <div className="w-full overflow-x-auto scrollbar-hide">
          <TabsList
            variant="line"
            className="bg-accent inline-flex min-w-max w-full flex-nowrap"
          >
            <TabsTrigger
              ref={(el) => {
                tabRefs.current["broken"] = el;
              }}
              value="broken"
              className="shrink-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" />
                Broken
                <span className="ml-1 text-muted-foreground">
                  {brokenCount}
                </span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              ref={(el) => {
                tabRefs.current["isolated"] = el;
              }}
              value="isolated"
              className="shrink-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <Ban className="text-warn" />
                isolated
                <span className="ml-1 text-muted-foreground">
                  {isolatedNodes.length}
                </span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              ref={(el) => {
                tabRefs.current["orphans"] = el;
              }}
              value="orphans"
              className="shrink-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <NoInComming className="text-warn" />
                Orphans
                <span className="ml-1 text-muted-foreground">
                  {orphanNodes.length}
                </span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              ref={(el) => {
                tabRefs.current["deadends"] = el;
              }}
              value="deadends"
              className="shrink-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <NoOutgoing className="text-warn" />
                Dead ends
                <span className="ml-1 text-muted-foreground">
                  {deadEndNodes.length}
                </span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              ref={(el) => {
                tabRefs.current["http"] = el;
              }}
              value="http"
              className="shrink-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <Globe className="text-cyan-500" />
                HTTP
                <span className="ml-1 text-muted-foreground">
                  {httpNodes.length}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* contents */}
        {/* ── Broken — uses BrokenLinksPanel as the content ── */}
        <TabsContent value="broken" className="p-0">
          <ScrollArea className="h-80">
            <BrokenLinksPanel crawl={crawl} />
          </ScrollArea>
        </TabsContent>

        {/* ── Orphans ── */}
        <TabsContent value="orphans" className="p-0">
          <ScrollArea className="h-80">
            {orphanNodes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No orphan notes.
              </div>
            )}
            {orphanNodes.map((n) => (
              <NodeRow
                key={n.noteId}
                node={n}
                icon={NoInComming}
                iconClass="text-warn"
                countLabel={
                  n.incomingCount > 0 ? `${n.incomingCount} in` : undefined
                }
              />
            ))}
          </ScrollArea>
        </TabsContent>

        {/* ── isolated ── */}
        <TabsContent value="isolated" className="p-0">
          <ScrollArea className="h-80">
            {isolatedNodes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No isolated notes.
              </div>
            )}
            {isolatedNodes.map((n) => (
              <NodeRow
                key={n.noteId}
                node={n}
                icon={Ban}
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
          <ScrollArea className="h-80">
            {deadEndNodes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No dead-end notes.
              </div>
            )}
            {deadEndNodes.map((n) => (
              <NodeRow
                key={n.noteId}
                node={n}
                icon={NoOutgoing}
                iconClass="text-warn"
                countLabel={
                  n.outgoingCount > 0 ? `${n.outgoingCount} out` : undefined
                }
              />
            ))}
          </ScrollArea>
        </TabsContent>

        {/* ── HTTP ── */}
        <TabsContent value="http" className="p-0">
          <ScrollArea className="h-80">
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
