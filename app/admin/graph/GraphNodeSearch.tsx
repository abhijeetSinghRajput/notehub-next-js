"use client";

import { useState, useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { AlertTriangle, Globe, Search, CheckCircle2, Ban, CommandIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IGraphNode } from "@/types/linkGraph.types";
import { NoInComming, NoOutgoing } from "./LinkReportPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// ── Node flag → group metadata ────────────────────────────────────────────────
type NodeGroup =
  | "isolated"
  | "broken"
  | "orphan"
  | "deadend"
  | "http"
  | "healthy";

function getNodeGroup(node: IGraphNode): NodeGroup {
  if (node.isOrphan && node.isDeadEnd) return "isolated";
  if (node.hasBrokenLinks) return "broken";
  if (node.isOrphan) return "orphan";
  if (node.isDeadEnd) return "deadend";
  if (node.hasHttp) return "http";
  return "healthy";
}

const GROUP_META: Record<
  NodeGroup,
  { label: string; icon: React.ElementType; className: string }
> = {
  isolated: { label: "Isolated", icon: Ban, className: "text-red-500" },
  broken: {
    label: "Broken links",
    icon: AlertTriangle,
    className: "text-orange-500",
  },
  orphan: { label: "Orphans", icon: NoInComming, className: "text-yellow-500" },
  deadend: {
    label: "Dead ends",
    icon: NoOutgoing,
    className: "text-purple-500",
  },
  http: { label: "HTTP links", icon: Globe, className: "text-cyan-500" },
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    className: "text-green-500",
  },
};

// Order groups — problems first
const GROUP_ORDER: NodeGroup[] = [
  "isolated",
  "broken",
  "orphan",
  "deadend",
  "http",
  "healthy",
];

interface GraphNodeSearchProps {
  nodes: IGraphNode[];
  onSelect: (nodeId: string) => void; // fly camera + select node
  className?: string;
}

export function GraphNodeSearch({
  nodes,
  onSelect,
  className,
}: GraphNodeSearchProps) {
  const [open, setOpen] = useState(false);

  // Group all nodes by flag
  const grouped = useMemo(() => {
    const map = new Map<NodeGroup, IGraphNode[]>();
    GROUP_ORDER.forEach((g) => map.set(g, []));

    nodes.forEach((n) => {
      const group = getNodeGroup(n);
      map.get(group)!.push(n);
    });

    return map;
  }, [nodes]);

  function handleSelect(nodeId: string) {
    onSelect(nodeId);
    setOpen(false);
  }

  return (
    <div className={cn("absolute left-3 top-3 z-20 w-72", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-72 justify-between bg-popover! text-muted-foreground hover:text-muted-foreground cursor-text!"
          >
            <div className="flex gap-2 items-center">
              <Search />
              Search Node
            </div>
            <kbd className="flex items-center text-xs gap-1">
              /
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="p-0">
          <Command className="rounded-xl">
            <CommandInput
              placeholder="Search by title or slug…"
              autoFocus
              className="h-9 text-sm"
            />
            <CommandList className="max-h-72">
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                No matching nodes found.
              </CommandEmpty>

              {GROUP_ORDER.map((group, i) => {
                const groupNodes = grouped.get(group) ?? [];

                if (groupNodes.length === 0) return null;

                const meta = GROUP_META[group];
                const Icon = meta.icon;

                return (
                  <span key={group}>
                    {i > 0 && <CommandSeparator />}

                    <CommandGroup
                      heading={
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-[11px]",
                            meta.className,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                          <span className="ml-auto text-muted-foreground font-normal">
                            {groupNodes.length}
                          </span>
                        </span>
                      }
                    >
                      {groupNodes.map((node) => (
                        <CommandItem
                          key={node.noteId}
                          value={`${node.title ?? ""} ${node.slug ?? ""}`}
                          keywords={[node.title ?? "", node.slug ?? ""]}
                          onSelect={() => handleSelect(node.noteId)}
                          className="cursor-pointer gap-2 py-2"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: getNodeDot(group) }}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium leading-tight">
                              {node.title || node.slug}
                            </p>

                            <p className="truncate font-mono text-[10px] text-muted-foreground">
                              /{node.slug}
                            </p>
                          </div>

                          <div className="ml-auto flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                            {node.incomingCount > 0 && (
                              <span>{node.incomingCount}↓</span>
                            )}

                            {node.outgoingCount > 0 && (
                              <span>{node.outgoingCount}↑</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </span>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function getNodeDot(group: NodeGroup): string {
  const colors: Record<NodeGroup, string> = {
    isolated: "#ef4444",
    broken: "#f97316",
    orphan: "#eab308",
    deadend: "#8b5cf6",
    http: "#06b6d4",
    healthy: "#22c55e",
  };
  return colors[group];
}
