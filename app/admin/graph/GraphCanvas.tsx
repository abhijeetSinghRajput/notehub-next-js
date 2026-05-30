"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Loader2, Maximize2, Minimize2, RefreshCw, Zap } from "lucide-react";
import { forceRadial } from "d3-force";
import { Button } from "@/components/ui/button";
import { useLinkGraphStore } from "@/app/stores/useLinkGraphStore";
import type { IGraphNode } from "@/types/linkGraph.types";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { GraphNodeSearch } from "./GraphNodeSearch";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getNodeColor(node: IGraphNode): string {
  if (node.hasBrokenLinks) return "#f97316";
  if (node.isOrphan && node.isDeadEnd) return "#ef4444";
  if (node.isOrphan) return "#eab308";
  if (node.isDeadEnd) return "#8b5cf6";
  if (node.hasHttp) return "#06b6d4";
  return "#22c55e";
}

const LEGEND = [
  { color: "#22c55e", label: "Healthy" },
  { color: "#eab308", label: "Orphan" },
  { color: "#8b5cf6", label: "Dead end" },
  { color: "#f97316", label: "Broken links" },
  { color: "#ef4444", label: "Isolated" },
  { color: "#06b6d4", label: "HTTP links" },
];

// ── Imperative handle exposed to parent ───────────────────────────────────────
export interface GraphCanvasHandle {
  // Fly camera to a node by noteId and select it
  flyToNode: (nodeId: string) => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface GraphCanvasProps {
  isLoadingCrawl: boolean;
  crawlError: string | null;
  crawlPhase: string;
  crawlProgress: {
    current: number;
    total: number;
    currentSlug: string;
    currentTitle: string;
  } | null;
  graphData: { nodes: any[]; links: any[] };
  nodeMap: Map<string, IGraphNode>;
  onStartCrawl: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  function GraphCanvas(
    {
      isLoadingCrawl,
      crawlError,
      crawlPhase,
      crawlProgress,
      graphData,
      nodeMap,
      onStartCrawl,
    },
    ref,
  ) {
    const { selectedNodeId, setSelectedNodeId } = useLinkGraphStore();

    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const highlightNodes = useRef(new Set<string>());
    const highlightLinks = useRef(new Set<string>());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 560 });

    const isCrawling = crawlPhase === "crawling" || crawlPhase === "connecting";

    // ── Adjacency map ──────────────────────────────────────────────────────────
    const adjacency = useMemo(() => {
      const map = new Map<string, Set<string>>();
      graphData.links.forEach((l: any) => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        if (!map.has(src)) map.set(src, new Set());
        if (!map.has(tgt)) map.set(tgt, new Set());
        map.get(src)!.add(tgt);
        map.get(tgt)!.add(src);
      });
      return map;
    }, [graphData]);

    // ── Expose flyToNode to parent via ref ─────────────────────────────────────
    useImperativeHandle(ref, () => ({
      flyToNode(nodeId: string) {
        // Find the live node object (post-simulation has x/y)
        const liveNode = graphData.nodes.find((n: any) => n.id === nodeId);

        if (liveNode) {
          graphRef.current.centerAt(liveNode.x, liveNode.y, 600);
          graphRef.current.zoom(4, 600);
        }

        // Trigger selection + highlight
        selectNode(nodeId);
      },
    }));

    // ── Physics tuning ─────────────────────────────────────────────────────────
    useEffect(() => {
      if (!graphRef.current || !graphData.nodes.length) return;
      graphRef.current.d3Force("charge")?.strength(-40);
      graphRef.current.d3Force("center")?.strength(0.08);
      graphRef.current.d3Force("radial", forceRadial(180, 0, 0).strength(0.06));
      graphRef.current.d3ReheatSimulation();
    }, [graphData]);

    // ── Resize observer ────────────────────────────────────────────────────────
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() =>
        setDimensions({ width: el.clientWidth, height: el.clientHeight }),
      );
      ro.observe(el);
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
      return () => ro.disconnect();
    }, [isFullscreen]);

    // ── Fullscreen ─────────────────────────────────────────────────────────────
    useEffect(() => {
      const handler = () =>
        setIsFullscreen(document.fullscreenElement === containerRef.current);
      document.addEventListener("fullscreenchange", handler);
      return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const toggleFullscreen = useCallback(async () => {
      if (!containerRef.current) return;
      try {
        if (!document.fullscreenElement) {
          await (containerRef.current as any).requestFullscreen?.();
          setTimeout(() => graphRef.current?.zoomToFit(400, 40), 300);
        } else {
          await document.exitFullscreen?.();
          setTimeout(() => graphRef.current?.zoomToFit(400, 40), 300);
        }
      } catch {}
    }, []);

    // ── Node selection + highlight ─────────────────────────────────────────────
    function selectNode(id: string) {
      setSelectedNodeId(id);
      highlightNodes.current.clear();
      highlightLinks.current.clear();

      highlightNodes.current.add(id);
      adjacency.get(id)?.forEach((nId) => highlightNodes.current.add(nId));

      graphData.links.forEach((l: any) => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        if (src === id || tgt === id) highlightLinks.current.add(l.id);
      });
    }

    const handleNodeClick = useCallback(
      (node: any) => {
        if (selectedNodeId === node.id) {
          setSelectedNodeId(null);
          highlightNodes.current.clear();
          highlightLinks.current.clear();
          return;
        }
        selectNode(node.id);
        flyToNode(node.id)
      },
      [selectedNodeId, setSelectedNodeId, adjacency, graphData.links],
    );

    const handleDeselect = useCallback(() => {
      setSelectedNodeId(null);
      highlightNodes.current.clear();
      highlightLinks.current.clear();
    }, [setSelectedNodeId]);

    const flyToNode = useCallback(
      (nodeId: string) => {
        const node = graphData.nodes.find((n: any) => n.id === nodeId);

        if (!node) return;

        selectNode(nodeId);

        if (node.x == null || node.y == null) return;

        graphRef.current?.centerAt(node.x, node.y, 1000);

        graphRef.current?.zoom(3, 1000);
      },
      [graphData.nodes],
    );

    // ── Canvas painters ────────────────────────────────────────────────────────
    const paintNode = useCallback(
      (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isSelected = node.id === selectedNodeId;
        const isHighlighted = highlightNodes.current.has(node.id);
        const hasSelection = selectedNodeId !== null;
        const isDimmed = hasSelection && !isHighlighted;
        const r = isSelected ? 7 : 5;
        const label = node.label as string;

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 2.8, 0, 2 * Math.PI);
          ctx.fillStyle = node.color + "33";
          ctx.fill();
        }

        if (isHighlighted && !isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI);
          ctx.strokeStyle = node.color + "aa";
          ctx.lineWidth = 1.5 / globalScale;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isDimmed ? node.color + "26" : node.color;
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5 / globalScale;
          ctx.stroke();
        }

        if (globalScale >= 1.5 || isSelected || isHighlighted) {
          const fontSize = Math.max(3, 11 / globalScale);
          ctx.font = `${isSelected ? "600" : "400"} ${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = isDimmed
            ? "rgba(200,210,240,0.15)"
            : isSelected
              ? "#ffffff"
              : "rgba(200,210,240,0.8)";
          const short = label.length > 22 ? label.slice(0, 21) + "…" : label;
          ctx.fillText(short, node.x, node.y + r + 2 / globalScale);
        }
      },
      [selectedNodeId],
    );

    const paintLink = useCallback(
      (link: any, ctx: CanvasRenderingContext2D) => {
        const isHighlighted = highlightLinks.current.has(link.id);
        const hasSelection = selectedNodeId !== null;
        const src =
          typeof link.source === "object" ? link.source : { x: 0, y: 0 };
        const tgt =
          typeof link.target === "object" ? link.target : { x: 0, y: 0 };

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isHighlighted
          ? "rgba(255,255,255,0.6)"
          : hasSelection
            ? "rgba(255,255,255,0.02)"
            : "rgba(255,255,255,0.08)";
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      },
      [selectedNodeId],
    );

    const selectedNode = selectedNodeId
      ? (nodeMap.get(selectedNodeId) ?? null)
      : null;
    const allNodes = useMemo(() => Array.from(nodeMap.values()), [nodeMap]);

    return (
      <div
        ref={containerRef}
        className={`relative ${isFullscreen ? "h-screen" : "h-[50vh]"} w-full overflow-hidden rounded-xl border bg-card`}
      >
        {/* Loading */}
        {isLoadingCrawl && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading graph…</p>
          </div>
        )}

        {/* Error / empty */}
        {!isLoadingCrawl &&
          !isCrawling &&
          (crawlError || graphData.nodes.length === 0) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
              <p className="text-sm text-muted-foreground">
                {crawlError ?? "No graph data yet."}
              </p>
              <button
                onClick={onStartCrawl}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Zap className="h-3 w-3" /> Run First Crawl
              </button>
            </div>
          )}

        {/* Crawl progress overlay */}
        {isCrawling && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            {crawlProgress ? (
              <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Zap className="h-4 w-4 animate-pulse text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Crawling notes…</p>
                    <p className="tabular-nums text-xs text-muted-foreground">
                      {crawlProgress.current} / {crawlProgress.total}
                    </p>
                  </div>
                </div>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${crawlProgress.total > 0 ? Math.round((crawlProgress.current / crawlProgress.total) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="font-mono text-foreground">
                    /{crawlProgress.currentSlug}
                  </span>
                  {" — "}
                  {crawlProgress.currentTitle}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Connecting…</p>
              </div>
            )}
          </div>
        )}

        {/* Search — top left */}
        {!isLoadingCrawl && allNodes.length > 0 && (
          <GraphNodeSearch
            nodes={allNodes}
            onSelect={flyToNode}
          />
        )}

        {/* Selected node detail — top right */}
        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={handleDeselect} />
        )}

        {/* Legend — bottom left */}
        <div className="absolute bottom-3 left-3 z-10 rounded-lg border bg-card/90 px-2.5 py-2 backdrop-blur-sm">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Legend
          </p>
          <div className="space-y-1">
            {LEGEND.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: color }}
                />
                <span className="text-[11px] text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls — bottom right */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => graphRef.current?.zoomToFit(400, 40)}
            tooltip="Fit to view"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            tooltip={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Graph */}
        {!isLoadingCrawl && graphData.nodes.length > 0 && (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeId="id"
            nodeLabel="label"
            nodeColor="color"
            nodeCanvasObject={paintNode}
            nodeCanvasObjectMode={() => "replace"}
            linkColor={() => "rgba(255,255,255,0.08)"}
            linkWidth={1}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={() => "rgba(255,255,255,0.2)"}
            backgroundColor="transparent"
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleDeselect}
            linkCanvasObject={paintLink}
            linkCanvasObjectMode={() => "replace"}
            warmupTicks={120}
            cooldownTicks={200}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 40)}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </div>
    );
  },
);
