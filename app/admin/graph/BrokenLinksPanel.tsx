"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { IGraphBrokenLink, ILinkGraphCrawl } from "@/types/linkGraph.types";
import Link from "next/link";

interface BrokenLinksPanelProps {
  crawl: ILinkGraphCrawl;
}

export function BrokenLinksPanel({ crawl }: BrokenLinksPanelProps) {
  const brokenLinks = crawl.brokenLinks ?? [];

  if (!brokenLinks.length) {
    return <div className="p-4 text-sm text-muted-foreground">No broken links found.</div>;
  }

  const grouped = brokenLinks.reduce<Record<string, IGraphBrokenLink[]>>((acc, bl) => {
    const key = bl.fromSlug?.trim() || "Unknown source";
    if (!acc[key]) acc[key] = [];
    acc[key].push(bl);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([aKey, aLinks], [bKey, bLinks]) => {
    const countDiff = bLinks.length - aLinks.length;
    return countDiff !== 0 ? countDiff : aKey.localeCompare(bKey);
  });

  return (
    <Accordion type="multiple" className="w-full">
      {sortedGroups.map(([group, links]) => {
        const sourceNode = crawl.nodes?.find((n) => n.slug === group);
        const sourceHref = sourceNode?.fullPath ? `/${sourceNode.fullPath}` : null;

        return (
          <AccordionItem key={group} value={group} className="border-b border-border">

            {/* Trigger — slug label + error count only, no link */}
            <AccordionTrigger className="rounded-none w-full flex items-center justify-between gap-2 py-3 px-4 hover:bg-sidebar-accent hover:no-underline cursor-pointer transition-colors text-left">
              <div className="flex items-center gap-2">
                <span className="size-6 bg-muted rounded-md flex items-center justify-center border text-muted-foreground select-none shrink-0">
                  <AlertTriangle className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-foreground">/{group}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto mr-2 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                {links.length}E
              </span>
            </AccordionTrigger>

            <AccordionContent className="p-0">
              {/* Source article link — top of content, not in trigger */}
              {sourceHref && (
                <div className="flex items-center gap-2 px-4 py-2 border-t border-border/60 bg-muted/30">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Link
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                  >
                    {sourceHref}
                  </Link>
                </div>
              )}

              {/* Broken href rows */}
              {links
                .sort((a, b) => a.href.localeCompare(b.href))
                .map((l, i) => (
                  <div
                    key={`${group}-${i}-${l.href}`}
                    className="flex gap-3 py-3 pl-8 pr-4 border-t border-border/40"
                  >
                    <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-0.5 select-text text-left flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight font-mono truncate">
                        {l.href}
                      </p>
                    </div>
                  </div>
                ))}
            </AccordionContent>

          </AccordionItem>
        );
      })}
    </Accordion>
  );
}