"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimeAgo } from "@/lib/utils";
import { History, Loader2, RefreshCcw } from "lucide-react";
import type { ILinkGraphHistory } from "@/types/linkGraph.types";
import { cn } from "@/lib/utils";

interface Props {
  history: ILinkGraphHistory[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

const statusDot: Record<string, string> = {
  completed: "bg-green-500",
  running: "bg-amber-500",
  failed: "bg-red-500",
};

export function CrawlHistoryPanel({ history, hasMore, loadingMore, onLoadMore }: Props) {
  if (!history.length) return null;

  return (
    <div className="">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Crawl History</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Status</TableHead>
            <TableHead>Triggered By</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead className="text-right">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h, i) => (
            <TableRow key={h._id}>
              <TableCell>
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    statusDot[h.status] ?? "bg-muted-foreground",
                  )}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium capitalize">{h.status}</span>
                  {i === 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Latest
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {h.triggeredBy ? h.triggeredBy.userName : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {h.summary ? (
                  <>
                    {h.summary.totalNotes} notes · {h.summary.totalEdges} edges ·{" "}
                    {h.summary.brokenLinkCount} broken
                  </>
                ) : h.errorMessage ? (
                  <span className="text-red-500 truncate">{h.errorMessage}</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(new Date(h.createdAt), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="flex justify-center px-4 py-3 border-t">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}