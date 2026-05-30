"use client";

import { Button } from "@/components/ui/button";
import type { IGraphNode } from "@/types/linkGraph.types";
import { ExternalLink, X } from "lucide-react";
import Link from "next/link";

function getNodeColor(node: IGraphNode): string {
  if (node.hasBrokenLinks) return "#f97316";
  if (node.isOrphan && node.isDeadEnd) return "#ef4444";
  if (node.isOrphan) return "#eab308";
  if (node.isDeadEnd) return "#8b5cf6";
  if (node.hasHttp) return "#06b6d4";
  return "#22c55e";
}

interface NodeDetailPanelProps {
  node: IGraphNode;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  return (
    <div className="absolute right-3 top-3 z-20 w-64 rounded-xl border bg-card/95 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-3">
        <Link href="/" className="group block min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: getNodeColor(node) }}
            />
            <p className="truncate text-sm font-semibold">{node.title}</p>
          </div>
          <div className="flex gap-1 items-center justify-between w-full text-muted-foreground">
            <p className="truncate font-mono text-xs group-hover:underline underline-offset-2 decoration-dotted">/{node.slug}</p>
            <ExternalLink className="size-3 shrink-0 transition-colors group-hover:text-foreground" />
          </div>
        </Link>
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="shrink-0 size-8"
        >
          <X />
        </Button>
      </div>

      {/* Counts */}
      <div className="border-t px-3 py-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Incoming</p>
          <p className="font-semibold tabular-nums text-base">
            {node.incomingCount}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Outgoing</p>
          <p className="font-semibold tabular-nums text-base">
            {node.outgoingCount}
          </p>
        </div>
      </div>

      {/* Flags */}
      {(node.isOrphan ||
        node.isDeadEnd ||
        node.hasBrokenLinks ||
        node.hasHttp) && (
        <div className="border-t px-3 py-2 flex flex-wrap gap-1">
          {node.isOrphan && (
            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
              Orphan
            </span>
          )}
          {node.isDeadEnd && (
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">
              Dead end
            </span>
          )}
          {node.hasBrokenLinks && (
            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500">
              Broken links
            </span>
          )}
          {node.hasHttp && (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
              HTTP
            </span>
          )}
        </div>
      )}
    </div>
  );
}
