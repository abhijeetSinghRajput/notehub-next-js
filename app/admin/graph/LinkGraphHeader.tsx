"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ExternalLink, GitFork, Globe, Loader2, RefreshCcw, Unlink, HelpCircle, type LucideIcon, Play, Check } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  tooltip,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
  tooltip?: string;
}) {
  const getFixText = (lab: string) => {
    switch (lab) {
      case "Orphans":
        return (
          "Fix by adding contextual internal links from related notes, overview pages, or explicit backlinks from other articles."
        );
      case "Dead Ends":
        return (
          "Add relevant outgoing links to related notes (related topics, next steps), or include navigation/see-also sections so readers can continue exploring."
        );
      case "Broken":
        return (
          "Fix or remove links that point to missing notes; restore the target note, update the slug, or replace with a correct URL or redirect."
        );
      case "HTTP":
        return (
          "Replace plain http:// links with https:// where possible, or update external links to their secure equivalents to avoid mixed-content and security warnings."
        );
      default:
        return "Review the note's links and metadata and update links or content to improve internal connectivity.";
    }
  };
  const card = (
    <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 min-w-0">
      <div className={cn("p-1 rounded-md",accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
  );

  if (!tooltip) return card;

  return (
    <div className="relative">
      {card}

      <div className="absolute top-2 right-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-label={`More info about ${label}`}
              variant="ghost"
              size="icon"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end">
            <PopoverHeader>
              <PopoverTitle>{label}</PopoverTitle>
            </PopoverHeader>
            <PopoverDescription>{tooltip}</PopoverDescription>
            <div className="mt-3">
              <h4 className="text-sm font-medium">How to fix</h4>
              <p className="text-sm text-muted-foreground mt-1">{getFixText(label)}</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function LinkGraphHeader({
  isCrawling,
  crawlPhase,
  hasSummary,
  lastCrawlLabel,
  onStartCrawl,
  counts,
}: {
  isCrawling: boolean;
  crawlPhase: string;
  hasSummary: boolean;
  lastCrawlLabel?: string | null;
  onStartCrawl: () => void;
  counts: {
    totalNotes: number;
    totalEdges: number;
    orphanCount: number;
    deadEndCount: number;
    brokenLinkCount: number;
    httpLinkCount: number;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Link Graph</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Internal link health across all notes
            {lastCrawlLabel && !isCrawling && (
              <span className="ml-2 text-xs opacity-60">· last crawl {lastCrawlLabel}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {crawlPhase === "done" && hasSummary && (
            <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
          <Button onClick={onStartCrawl} disabled={isCrawling} size="sm" className="gap-2 w-28">
            {isCrawling ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
            {isCrawling ? "Crawling…" : "New Crawl"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard label="Notes" value={counts.totalNotes} icon={ExternalLink} accent="bg-primary/10 text-primary" />
        <StatCard label="Edges" value={counts.totalEdges} icon={GitFork} accent="bg-blue-500/10 text-blue-500" />
        <StatCard
          label="Orphans"
          value={counts.orphanCount}
          icon={Unlink}
          accent="bg-yellow-500/10 text-yellow-500"
          tooltip="No incoming backlinks from other notes/articles."
        />
        <StatCard label="Dead Ends" value={counts.deadEndCount} icon={ArrowUpRight} accent="bg-purple-500/10 text-purple-500" tooltip="Notes with no outgoing links" />
        <StatCard label="Broken" value={counts.brokenLinkCount} icon={AlertTriangle} accent="bg-orange-500/10 text-orange-500" tooltip="Links pointing to non-existent notes" />
        <StatCard label="HTTP" value={counts.httpLinkCount} icon={Globe} accent="bg-cyan-500/10 text-cyan-500" tooltip="Notes containing plain http:// links (not https)" />
      </div>
    </div>
  );
}