"use client";

import { useState, useRef } from "react";
import {
  DatabaseZap,
  Play,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileJson,
  Sheet,
  TriangleAlert,
  Terminal,
  Sparkle,
  EllipsisVertical,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/lib/axios";
import axios from "axios";
import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

// ─── Constants ───────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  "Give me all users for profile completion — email, username, hasAvatar, hasBio, hasSkill, hasSocialLinks",
  "List all notes grouped by author with note name, collection, slug and updatedAt",
  'Find users whose name includes "kumar"',
  "Users registered in the last 30 days",
  "Campaign delivery stats — name, total sent, open rate, click rate",
  "Notes with no content (empty or missing)",
  "All suppressed emails with campaign name and unsubscribed date",
];

const PLAYGROUND_EXAMPLES = [
  {
    label: "Banned users",
    query: `db.users.aggregate([
  { "$match": { "isBanned": true } },
  {
    "$project": {
      "fullName": 1,
      "email": 1,
      "userName": 1,
      "role": 1
    }
  },
  { "$limit": 20 }
])`,
  },
  {
    label: "Notes per author",
    query: `db.notes.aggregate([
  { "$match": { "visibility": "public" } },
  {
    "$group": {
      "_id": "$userId",
      "noteCount": { "$sum": 1 },
      "lastUpdated": { "$max": "$contentUpdatedAt" }
    }
  },
  { "$sort": { "noteCount": -1 } },
  { "$limit": 15 }
])`,
  },
  {
    label: "Campaign stats",
    query: `db.campaigns.aggregate([
  { "$match": { "status": "done" } },
  {
    "$project": {
      "name": 1,
      "status": 1,
      "sentAt": 1,
      "stats.total": 1,
      "stats.sent": 1,
      "stats.opened": 1,
      "stats.clicked": 1,
      "stats.failed": 1
    }
  },
  { "$limit": 20 }
])`,
  },
  {
    label: "Recent signups",
    query: `db.users.aggregate([
  {
    "$match": {
      "createdAt": {
        "$gte": { "$date": "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}" }
      }
    }
  },
  {
    "$project": {
      "fullName": 1,
      "email": 1,
      "userName": 1,
      "role": 1,
      "createdAt": 1
    }
  },
  { "$sort": { "createdAt": -1 } },
  { "$limit": 20 }
])`,
  },
  {
    label: "Failed campaign jobs",
    query: `db.campaignjobs.aggregate([
  { "$match": { "status": "failed" } },
  {
    "$lookup": {
      "from": "campaigns",
      "localField": "campaignId",
      "foreignField": "_id",
      "as": "campaign"
    }
  },
  { "$unwind": "$campaign" },
  {
    "$project": {
      "email": 1,
      "error": 1,
      "processedAt": 1,
      "campaign.name": 1,
      "campaign.status": 1
    }
  },
  { "$limit": 20 }
])`,
  },
  {
    label: "Suppressed emails",
    query: `db.suppressedemails.aggregate([
  { "$match": {} },
  {
    "$lookup": {
      "from": "campaigns",
      "localField": "campaignId",
      "foreignField": "_id",
      "as": "campaign"
    }
  },
  { "$unwind": { "path": "$campaign", "preserveNullAndEmptyArrays": true } },
  {
    "$project": {
      "email": 1,
      "unsubscribedAt": 1,
      "campaign.name": 1
    }
  },
  { "$limit": 20 }
])`,
  },
  {
    label: "Notes with SEO score",
    query: `db.notes.aggregate([
  { "$match": { "seo.score": { "$exists": true } } },
  {
    "$project": {
      "name": 1,
      "slug": 1,
      "visibility": 1,
      "seo.score": 1,
      "seo.title": 1,
      "contentUpdatedAt": 1
    }
  },
  { "$sort": { "seo.score": -1 } },
  { "$limit": 20 }
])`,
  },
  {
    label: "Orphan notes (link graph)",
    query: `db.linkgraphcrawls.aggregate([
  { "$match": { "status": "completed" } },
  { "$sort": { "completedAt": -1 } },
  { "$limit": 1 },
  { "$unwind": "$nodes" },
  { "$match": { "nodes.isOrphan": true } },
  {
    "$project": {
      "nodes.slug": 1,
      "nodes.title": 1,
      "nodes.fullPath": 1,
      "nodes.incomingCount": 1,
      "nodes.outgoingCount": 1
    }
  }
])`,
  },
];

const PLAYGROUND_HINT = `Syntax: db.<collection>.aggregate([...])
Pipeline must be valid JSON — use double quotes.
ObjectIds  →  { "$oid": "64f1..." }
Dates      →  { "$date": "2024-01-01T00:00:00.000Z" }`;

// ─── Types ───────────────────────────────────────────────────────────────────

type QueryResult = {
  result: Record<string, unknown>[];
  pipeline: object[];
  collection: string;
  explanation?: string;
};

// ─── Result Panel (shared between AI + Playground) ───────────────────────────

function ResultPanel({
  data,
  onClose,
}: {
  data: QueryResult;
  onClose?: () => void;
}) {
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  const resultKeys = data.result.length ? Object.keys(data.result[0]) : [];

  function copyJSON() {
    copy(JSON.stringify(data.result, null, 2), "JSON copied");
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(data.result, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `notehub-query-${Date.now()}.json`;
    a.click();
  }

  function downloadCSV() {
    if (!data.result.length) return;
    const keys = Object.keys(data.result[0]);
    const rows = [
      keys.join(","),
      ...data.result.map((row) =>
        keys.map((k) => JSON.stringify(row[k] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `notehub-query-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="text-sm">
          <div className="font-medium">{data.collection}</div>
          <Badge variant="outline" className="text-xs font-mono">
            {data.result.length} result{data.result.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Collapsible open={pipelineOpen} onOpenChange={setPipelineOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
                Pipeline
                {pipelineOpen ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <Separator orientation="vertical" className="h-4" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full">
                <EllipsisVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem className="gap-1.5 text-xs" onClick={copyJSON}>
                {copied ? (
                  <Check />
                ) : (
                  <Copy />
                )}
                {copied ? "Copied" : "Copy to clipboard"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-1.5 text-xs"
                onClick={downloadJSON}
              >
                <FileJson />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-1.5 text-xs"
                onClick={downloadCSV}
              >
                <Sheet />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Explanation (AI mode only) */}
      {data.explanation && (
        <div className="px-4 w-full bg-muted py-3 border-b text-muted-foreground text-xs italic">
          {data.explanation}
        </div>
      )}

      {/* Pipeline JSON */}
      <Collapsible open={pipelineOpen} onOpenChange={setPipelineOpen}>
        <CollapsibleContent>
          <div className="border-b border-border">
            <CodeMirror
              value={JSON.stringify(data.pipeline, null, 2)}
              height="250px"
              extensions={[json()]}
              theme={oneDark}
              editable={false}
              readOnly={true}
              basicSetup={{
                foldGutter: true,
                lineNumbers: true,
                highlightActiveLine: false,
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Table */}
      {data.result.length === 0 ? (
        <div className="p-6 py-16 text-center text-sm text-muted-foreground">
          No documents matched this query.
        </div>
      ) : (
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {resultKeys.map((key) => (
                  <TableHead
                    key={key}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.result.map((row, i) => (
                <TableRow key={i} className="text-sm">
                  {resultKeys.map((key) => {
                    const val = row[key];
                    return (
                      <TableCell
                        key={key}
                        className="max-w-55 truncate whitespace-nowrap font-mono text-xs"
                      >
                        {typeof val === "boolean" ? (
                          <Badge
                            variant={val ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              val
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400"
                                : "",
                            )}
                          >
                            {val ? "true" : "false"}
                          </Badge>
                        ) : val === null || val === undefined ? (
                          <span className="text-muted-foreground/50">—</span>
                        ) : typeof val === "object" ? (
                          <span className="text-muted-foreground">
                            {JSON.stringify(val)}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}

// ─── AI Mode ─────────────────────────────────────────────────────────────────

function AIMode() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QueryResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function runQuery() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: res } = await axiosInstance.post("/admin/query/ai", {
        query,
      });
      setData(res);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error || err.message || "Something went wrong",
        );
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runQuery();
  }

  return (
    <div className="space-y-0">
      {/* Examples */}
      <div className="max-w-6xl mx-auto p-6 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Examples
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q);
                textareaRef.current?.focus();
              }}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
            >
              {q.length > 55 ? q.slice(0, 55) + "…" : q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about your NoteHub data…\ne.g. Give me all users where name includes "kumar"`}
            className="min-h-24 resize-none border-0 focus-visible:ring-0 rounded-none text-sm"
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {query.length} chars · <kbd className="font-mono">⌘ Enter</kbd> to
              run
            </span>
            <Button
              size="sm"
              onClick={runQuery}
              disabled={!query.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {loading ? "Running…" : "Run query"}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <ResultPanel data={data} />
        </div>
      )}
    </div>
  );
}

// ─── Playground Mode ──────────────────────────────────────────────────────────

const DEFAULT_PLAYGROUND = `db.users.aggregate([
  { "$match": { "isActive": true } },
  { "$project": { "email": 1, "username": 1, "createdAt": 1 } },
  { "$limit": 20 }
])`;

function PlaygroundMode() {
  const [query, setQuery] = useState(DEFAULT_PLAYGROUND);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QueryResult | null>(null);

  async function runQuery() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: res } = await axiosInstance.post("/admin/query/raw", {
        query,
      });
      setData(res);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message,
        );
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runQuery();
  }

  return (
    <div className="space-y-0">
      {/* Examples */}
      <div className="max-w-6xl mx-auto p-6 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Examples
        </p>
        <div className="flex flex-wrap gap-2">
          {PLAYGROUND_EXAMPLES.map(({ label, query: q }) => (
            <button
              key={label}
              onClick={() => setQuery(q)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                db.&lt;collection&gt;.aggregate([...])
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-xs text-xs font-mono whitespace-pre"
                  >
                    {PLAYGROUND_HINT}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              size="sm"
              onClick={runQuery}
              disabled={!query.trim() || loading}
              className="gap-2 h-7 text-xs"
            >
              {loading ? (
                <Loader2 className=" animate-spin" />
              ) : (
                <Play />
              )}
              {loading ? "Running…" : "Run"}
            </Button>
          </div>

          {/* CodeMirror editor */}
          <div onKeyDown={handleKeyDown}>
            <CodeMirror
              value={query}
              onChange={(val) => setQuery(val)}
              height="280px"
              extensions={[javascript()]}
              theme={oneDark}
              basicSetup={{
                foldGutter: true,
                lineNumbers: true,
                highlightActiveLine: true,
                autocompletion: false,
              }}
            />
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Read-only · aggregate only ·{" "}
              <kbd className="font-mono">⌘ Enter</kbd> to run
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {query.split("\n").length} lines
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription className="font-mono text-xs">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <ResultPanel data={data} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QueryConsolePage() {
  const [mode, setMode] = useState<"ai" | "console">("ai");

  return (
    <div>
      {/* Header */}
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex gap-2 items-start">
          <div className="flex items-center shrink-0 justify-center w-9 h-9 rounded-lg bg-muted">
            <DatabaseZap className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">
              Query console
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "ai"
                ? "Ask anything in plain English — runs as a MongoDB aggregation pipeline"
                : "Write raw aggregation queries — db.collection.aggregate([...])"}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex border rounded-md overflow-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9",
                    mode === "ai" && "bg-muted",
                  )}
                  onClick={() => setMode("ai")}
                >
                  <Sparkle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">AI query</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9 border-l",
                    mode === "console" && "bg-muted",
                  )}
                  onClick={() => setMode("console")}
                >
                  <Terminal className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Playground</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Separator />

      {/* Mode content */}
      {mode === "ai" ? <AIMode /> : <PlaygroundMode />}
    </div>
  );
}
