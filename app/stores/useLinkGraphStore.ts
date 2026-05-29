"use client";

import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import type {
  ILinkGraphCrawl,
  ILinkGraphHistory,
  ICrawlProgressEvent,
  ICrawlDoneEvent,
  IGraphSummary,
} from "@/types/linkGraph.types";

// ── SSE progress state ────────────────────────────────────────────────────────
export type CrawlPhase =
  | "idle"
  | "connecting"
  | "crawling"
  | "done"
  | "error";

export interface CrawlProgress {
  current: number;
  total: number;
  currentSlug: string;
  currentTitle: string;
}

interface LinkGraphStore {
  // ── Latest crawl ────────────────────────────────────────────────────────────
  crawl: ILinkGraphCrawl | null;
  isLoadingCrawl: boolean;
  crawlError: string | null;
  fetchLatestCrawl: () => Promise<void>;

  // ── History ─────────────────────────────────────────────────────────────────
  history: ILinkGraphHistory[];
  isLoadingHistory: boolean;
  fetchHistory: () => Promise<void>;

  // ── Active crawl SSE ─────────────────────────────────────────────────────────
  crawlPhase: CrawlPhase;
  crawlProgress: CrawlProgress | null;
  crawlSummary: IGraphSummary | null; // populated when done
  startCrawl: () => void;
  abortCrawl: () => void;
  _sseAbort: (() => void) | null;

  // ── Selected node (for detail panel) ────────────────────────────────────────
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export const useLinkGraphStore = create<LinkGraphStore>((set, get) => ({
  // ── Latest crawl ────────────────────────────────────────────────────────────
  crawl: null,
  isLoadingCrawl: false,
  crawlError: null,

  fetchLatestCrawl: async () => {
    set({ isLoadingCrawl: true, crawlError: null });
    try {
      const res = await axiosInstance.get("/admin/link-graph/latest");
      set({ crawl: res.data.crawl, isLoadingCrawl: false });
    } catch (err: any) {
      const msg =
        err?.response?.status === 404
          ? "No crawl found. Run your first crawl to see the graph."
          : err?.response?.data?.message || "Failed to load graph data.";
      set({ crawlError: msg, isLoadingCrawl: false });
    }
  },

  // ── History ─────────────────────────────────────────────────────────────────
  history: [],
  isLoadingHistory: false,

  fetchHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const res = await axiosInstance.get("/admin/link-graph/history");
      set({ history: res.data.history, isLoadingHistory: false });
    } catch {
      set({ isLoadingHistory: false });
    }
  },

  // ── SSE Crawl ────────────────────────────────────────────────────────────────
  crawlPhase: "idle",
  crawlProgress: null,
  crawlSummary: null,
  _sseAbort: null,

  startCrawl: () => {
    const { _sseAbort } = get();
    // Abort any existing SSE connection
    if (_sseAbort) _sseAbort();

    set({
      crawlPhase: "connecting",
      crawlProgress: null,
      crawlSummary: null,
      crawlError: null,
    });

    // SSE must be authenticated. We POST via fetch (EventSource can't POST or
    // send cookies on all browsers). We stream the response manually.
    const controller = new AbortController();

    const abort = () => {
      controller.abort();
      set({ crawlPhase: "idle", _sseAbort: null });
    };

    set({ _sseAbort: abort });

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/link-graph/crawl`,
          {
            method: "POST",
            credentials: "include",
            headers: { Accept: "text/event-stream" },
            signal: controller.signal,
          }
        );

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        set({ crawlPhase: "crawling" });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by double newlines
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            if (!frame.trim() || frame.startsWith(": ping")) continue;

            // Parse event name and data
            const lines = frame.split("\n");
            let eventName = "message";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event: "))
                eventName = line.slice(7).trim();
              if (line.startsWith("data: "))
                dataStr = line.slice(6).trim();
            }

            if (!dataStr) continue;

            let payload: any;
            try {
              payload = JSON.parse(dataStr);
            } catch {
              continue;
            }

            switch (eventName) {
              case "start":
                set({ crawlPhase: "crawling" });
                break;

              case "progress": {
                const p = payload as ICrawlProgressEvent;
                set({
                  crawlProgress: {
                    current: p.current,
                    total: p.total,
                    currentSlug: p.slug,
                    currentTitle: p.title,
                  },
                });
                break;
              }

              case "done": {
                const d = payload as ICrawlDoneEvent;
                set({
                  crawlPhase: "done",
                  crawlSummary: d.summary,
                  _sseAbort: null,
                });
                // Reload full graph data now that crawl is complete
                get().fetchLatestCrawl();
                get().fetchHistory();
                toast.success("Crawl complete!");
                break;
              }

              case "error":
                set({
                  crawlPhase: "error",
                  crawlError: payload.message || "Crawl failed.",
                  _sseAbort: null,
                });
                toast.error(payload.message || "Crawl failed.");
                break;
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user cancelled
        set({
          crawlPhase: "error",
          crawlError: "Lost connection to crawl stream.",
          _sseAbort: null,
        });
        toast.error("Lost connection to crawl stream.");
      }
    })();
  },

  abortCrawl: () => {
    const { _sseAbort } = get();
    if (_sseAbort) _sseAbort();
  },

  // ── Selected node ────────────────────────────────────────────────────────────
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));