// ── Link Graph Types ──────────────────────────────────────────────────────────

import { IBase, IUser } from "./model";

export interface IGraphEdge {
  from: string;       // ObjectId string
  to: string;         // ObjectId string
  fromSlug?: string;  // display only
  toSlug?: string;    // display only
}

export interface IGraphNode {
  noteId: string;
  slug: string;
  title: string;
  fullPath: string;  // "username/collectionSlug/noteSlug" — use as href={`/${fullPath}`}
  incomingCount: number;
  outgoingCount: number;
  isOrphan: boolean;
  isIsolated: boolean;
  isDeadEnd: boolean;
  hasBrokenLinks: boolean;
  hasHttp: boolean;
}

export interface IGraphBrokenLink {
  from: string;       // ObjectId string
  fromSlug?: string;
  href: string;       // raw unresolved href
}

export interface IGraphSummary {
  totalNotes: number;
  totalEdges: number;
  orphanCount: number;
  deadEndCount: number;
  brokenLinkCount: number;
  httpLinkCount: number;
}

export interface ILinkGraphCrawl extends IBase {
  status: "running" | "completed" | "failed";
  edges: IGraphEdge[];
  nodes: IGraphNode[];
  brokenLinks: IGraphBrokenLink[];
  summary: IGraphSummary;
  triggeredBy?: Pick<IUser, "_id" | "userName" | "fullName">;
  completedAt?: string;
  errorMessage?: string;
}

export interface ILinkGraphHistory {
  _id: string;
  status: "running" | "completed" | "failed";
  summary?: IGraphSummary;
  createdAt: string;
  completedAt?: string;
  triggeredBy?: Pick<IUser, "_id" | "userName" | "fullName">;
  errorMessage?: string;
}

export interface ICrawlProgressEvent {
  type: "progress";
  current: number;
  total: number;
  noteId: string;
  slug: string;
  title: string;
}

export interface ICrawlDoneEvent {
  crawlId: string;
  summary: IGraphSummary;
  completedAt: string;
}