"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Loader2, Zap, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { forceRadial } from "d3-force";
import { useLinkGraphStore } from "@/app/stores/useLinkGraphStore";
import type { IGraphNode } from "@/types/linkGraph.types";
import { formatTimeAgo } from "@/lib/utils";
import { LinkReportPanel } from "./LinkReportPanel";
import { CrawlHistoryPanel } from "./CrawlHistoryPanel";
import { LinkGraphHeader } from "./LinkGraphHeader";
import { Button } from "@/components/ui/button";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

function getNodeColor(node: IGraphNode): string {
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

export default function LinkGraphClient() {
  const {
    crawl,
    isLoadingCrawl,
    crawlError,
    fetchLatestCrawl,
    history,
    fetchHistory,
    crawlPhase,
    crawlProgress,
    crawlSummary,
    startCrawl,
    selectedNodeId,
    setSelectedNodeId,
  } = useLinkGraphStore();

  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: containerRef.current?.clientWidth ?? 800,
    height: containerRef.current?.clientHeight ?? 700,
  });
  // Track highlighted nodes and links
  const highlightNodes = useRef(new Set<string>());
  const highlightLinks = useRef(new Set<string>());

  useEffect(() => {
    fetchLatestCrawl();
    fetchHistory();
  }, [fetchLatestCrawl, fetchHistory]);

  const { graphData, nodeMap } = useMemo(() => {
    if (!crawl)
      return {
        graphData: { nodes: [], links: [] },
        nodeMap: new Map<string, IGraphNode>(),
      };

    const nodeMap = new Map<string, IGraphNode>();
    crawl.nodes.forEach((n) => nodeMap.set(n.noteId, n));

    return {
      nodeMap,
      graphData: {
        nodes: crawl.nodes.map((n) => ({
          id: n.noteId,
          label: n.title || n.slug,
          color: getNodeColor(n),
        })),
        links: crawl.edges.map((e, i) => ({
          id: `e-${i}`,
          source: e.from,
          target: e.to,
        })),
      },
    };
  }, [crawl]);

  // Tune physics after data loads
  useEffect(() => {
    if (!graphRef.current || !graphData.nodes.length) return;
    graphRef.current.d3Force("charge")?.strength(-40);
    graphRef.current.d3Force("center")?.strength(0.08);
    graphRef.current.d3Force("radial", forceRadial(180, 0, 0).strength(0.06));
    graphRef.current.d3ReheatSimulation();
  }, [graphData]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Resize observer to update graph dimensions when container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    // initialize
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, [containerRef, isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        // enter
        // @ts-ignore
        await containerRef.current.requestFullscreen?.();
        setIsFullscreen(true);
        setTimeout(() => graphRef.current?.zoomToFit(400, 40), 300);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
        setTimeout(() => graphRef.current?.zoomToFit(400, 40), 300);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Build adjacency when data changes
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

  const selectedNode = selectedNodeId
    ? (nodeMap.get(selectedNodeId) ?? null)
    : null;
  const lastCrawl = history[0];
  const isCrawling = crawlPhase === "crawling" || crawlPhase === "connecting";
  const counts = crawlSummary ??
    crawl?.summary ?? {
      totalNotes: 0,
      totalEdges: 0,
      orphanCount: 0,
      deadEndCount: 0,
      brokenLinkCount: 0,
      httpLinkCount: 0,
    };

  const handleNodeClick = useCallback(
    (node: any) => {
      const id = node.id;
      if (selectedNodeId === id) {
        // Deselect — clear highlights
        setSelectedNodeId(null);
        highlightNodes.current.clear();
        highlightLinks.current.clear();
        return;
      }

      setSelectedNodeId(id);
      highlightNodes.current.clear();
      highlightLinks.current.clear();

      // Add clicked node + all direct neighbours
      highlightNodes.current.add(id);
      adjacency.get(id)?.forEach((neighborId) => {
        highlightNodes.current.add(neighborId);
      });

      // Add all connected links
      graphData.links.forEach((l: any) => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        if (src === id || tgt === id) {
          highlightLinks.current.add(l.id);
        }
      });
    },
    [selectedNodeId, setSelectedNodeId, adjacency, graphData.links],
  );

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = node.id === selectedNodeId;
      const isHighlighted = highlightNodes.current.has(node.id);
      const hasSelection = selectedNodeId !== null;
      const isDimmed = hasSelection && !isHighlighted;

      const r = isSelected ? 7 : 5;
      const label = node.label as string;
      const alpha = isDimmed ? 0.15 : 1;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.8, 0, 2 * Math.PI);
        ctx.fillStyle = node.color + "33";
        ctx.fill();
      }

      // Neighbour ring
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

  const lastCrawlLabel = lastCrawl?.createdAt
    ? formatTimeAgo(new Date(lastCrawl.createdAt), { addSuffix: true })
    : null;

  return (
    <div className="space-y-4">
      <LinkGraphHeader
        isCrawling={isCrawling}
        crawlPhase={crawlPhase}
        hasSummary={Boolean(crawlSummary ?? crawl?.summary)}
        lastCrawlLabel={lastCrawlLabel}
        onStartCrawl={startCrawl}
        counts={counts}
      />

      {/* ── Canvas ── */}
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
                onClick={startCrawl}
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

        {/* Selected node panel */}
        {selectedNode && (
          <div className="absolute right-3 top-3 z-20 w-64 rounded-xl border bg-card/95 shadow-xl backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: getNodeColor(selectedNode) }}
                  />
                  <p className="truncate text-sm font-semibold">
                    {selectedNode.title}
                  </p>
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  /{selectedNode.slug}
                </p>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="border-t px-3 py-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Incoming</p>
                <p className="font-semibold tabular-nums text-base">
                  {selectedNode.incomingCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Outgoing</p>
                <p className="font-semibold tabular-nums text-base">
                  {selectedNode.outgoingCount}
                </p>
              </div>
            </div>
            {(selectedNode.isOrphan ||
              selectedNode.isDeadEnd ||
              selectedNode.hasBrokenLinks ||
              selectedNode.hasHttp) && (
              <div className="border-t px-3 py-2 flex flex-wrap gap-1">
                {selectedNode.isOrphan && (
                  <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                    Orphan
                  </span>
                )}
                {selectedNode.isDeadEnd && (
                  <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">
                    Dead end
                  </span>
                )}
                {selectedNode.hasBrokenLinks && (
                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500">
                    Broken links
                  </span>
                )}
                {selectedNode.hasHttp && (
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                    HTTP
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
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

        {/* Fit + Fullscreen buttons */}
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
            onBackgroundClick={() => {
              setSelectedNodeId(null);
              highlightNodes.current.clear();
              highlightLinks.current.clear();
            }}
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

      {crawl && <LinkReportPanel crawl={crawl} />}
      {history.length > 0 && <CrawlHistoryPanel history={history} />}
    </div>
  );
}
