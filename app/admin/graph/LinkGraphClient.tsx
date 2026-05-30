"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLinkGraphStore } from "@/app/stores/useLinkGraphStore";
import type { IGraphNode } from "@/types/linkGraph.types";
import { formatTimeAgo } from "@/lib/utils";
import { GraphCanvas, type GraphCanvasHandle, getNodeColor } from "./GraphCanvas";
import { LinkReportPanel } from "./LinkReportPanel";
import { CrawlHistoryPanel } from "./CrawlHistoryPanel";
import { LinkGraphHeader } from "./LinkGraphHeader";

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
  } = useLinkGraphStore();

  const canvasRef = useRef<GraphCanvasHandle>(null);

  useEffect(() => {
    fetchLatestCrawl();
    fetchHistory();
  }, [fetchLatestCrawl, fetchHistory]);

  const { graphData, nodeMap } = useMemo(() => {
    if (!crawl) {
      return { graphData: { nodes: [], links: [] }, nodeMap: new Map<string, IGraphNode>() };
    }
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

  const lastCrawl = history[0];
  const isCrawling = crawlPhase === "crawling" || crawlPhase === "connecting";
  const counts = crawlSummary ?? crawl?.summary ?? {
    totalNotes: 0,
    totalEdges: 0,
    orphanCount: 0,
    deadEndCount: 0,
    brokenLinkCount: 0,
    httpLinkCount: 0,
  };
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

      <GraphCanvas
        ref={canvasRef}
        isLoadingCrawl={isLoadingCrawl}
        crawlError={crawlError}
        crawlPhase={crawlPhase}
        crawlProgress={crawlProgress}
        graphData={graphData}
        nodeMap={nodeMap}
        onStartCrawl={startCrawl}
      />

      {crawl && <LinkReportPanel crawl={crawl} />}
      {history.length > 0 && <CrawlHistoryPanel history={history} />}
    </div>
  );
}