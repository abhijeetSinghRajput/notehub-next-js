"use client";

import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";
import type { ILinkGraphHistory } from "@/types/linkGraph.types";

export function CrawlHistoryPanel({ history }: { history: ILinkGraphHistory[] }) {
  if (!history.length) return null;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Crawl History</span>
      </div>
      <div className="divide-y">
        {history.map((h, i) => (
          <div key={h._id} className="flex items-center gap-3 px-4 py-3">
            <span className="h-2 w-2 rounded-full shrink-0 bg-green-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium capitalize">{h.status}</span>
                {i === 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Latest</Badge>}
                {h.triggeredBy && <span className="text-xs text-muted-foreground">by {h.triggeredBy.userName}</span>}
              </div>
              {h.summary && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {h.summary.totalNotes} notes · {h.summary.totalEdges} edges · {h.summary.brokenLinkCount} broken
                </p>
              )}
              {h.errorMessage && <p className="text-xs text-red-500 mt-0.5 truncate">{h.errorMessage}</p>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(new Date(h.createdAt), { addSuffix: true })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}