"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Mail,
  Send,
  Trash2,
  Eye,
  EllipsisVertical,
  RotateCcw,
  Pencil,
  Copy,
} from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { Campaign, CampaignStats } from "@/types/mailer.types";
import { useCampaignSocket } from "@/hooks/useCampaignSocket";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/app/stores/useCampaignStore";
import { useState } from "react";
import DeleteConfirmDialog from "./delete-confirm-dialog";

const statusBadge: Record<
  string,
  "secondary" | "default" | "destructive" | "outline" | "success"
> = {
  draft: "secondary",
  sending: "outline",
  done: "success",
  failed: "destructive",
};

interface LiveProgressProps {
  campaignId: string;
  initialStats: CampaignStats;
  onDone: (id: string, stats: CampaignStats, status: "done" | "failed") => void;
}

const LiveProgress = ({
  campaignId,
  initialStats,
  onDone,
}: LiveProgressProps) => {
  const [stats, setStats] = useState<CampaignStats>(initialStats);

  useCampaignSocket({
    campaignId,
    onProgress: (s) => setStats(s),
    onDone: (s, status) => onDone(campaignId, s, status),
  });

  const processed = stats.sent + stats.failed;
  const pct = stats.total > 0 ? Math.round((processed / stats.total) * 100) : 0;

  return (
    <div className="space-y-1 min-w-40">
      <div className="flex justify-between text-muted-foreground text-xs">
        <span>
          {stats.sent} sent · {stats.failed} failed
        </span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
};

interface CampaignTableProps {
  campaigns: Campaign[];
  loading: boolean;
}

const CampaignTable = () => {
  const router = useRouter();
  const {
    campaigns,
    loading,
    sending,
    handleSend,
    handleDuplicate,
    handleDelete,
    handleDone,
    handleRetryFailed,
    fetchJobs,
  } = useCampaignStore();
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Opened</TableHead>
            <TableHead>Clicked</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Sent At</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }).map((_, i) => (
            <TableRow key={i} className="h-13.25">
              <TableCell>
                <Skeleton className="w-32 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-12 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-12 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-12 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-40 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-20 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-8 h-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 py-16 text-muted-foreground">
        <Mail className="w-8 h-8" />
        <p className="text-sm">No campaigns yet</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Opened</TableHead>
            <TableHead>Clicked</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Sent At</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((c) => (
            <TableRow
              key={c._id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/campaign/${c._id}`)}
            >
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Badge variant={statusBadge[c.status]}>
                  {c.status === "sending" && (
                    <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                  )}
                  {c.status}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(
                  c.stats.opened ? "text-blue-500" : "text-muted-foreground",
                )}
              >
                {c.stats.opened === 0 ? "—" : c.stats.opened}
              </TableCell>
              <TableCell
                className={cn(
                  c.stats.clicked ? "text-blue-500" : "text-muted-foreground",
                )}
              >
                {c.stats.clicked === 0 ? "—" : c.stats.clicked}
              </TableCell>
              <TableCell>
                {c.status === "sending" ? (
                  <LiveProgress
                    campaignId={c._id}
                    initialStats={c.stats}
                    onDone={handleDone}
                  />
                ) : c.stats.total > 0 ? (
                  <div className="space-y-1 min-w-40">
                    <div className="text-muted-foreground text-xs">
                      {c.stats.sent} sent · {c.stats.failed} failed ·{" "}
                      {c.stats.total} total
                    </div>
                    <Progress
                      value={Math.round((c.stats.sent / c.stats.total) * 100)}
                      className="h-1.5"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(c.status === "draft" || c.status === "failed") && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/campaign/${c._id}/edit`);
                          }}
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </DropdownMenuItem>
                      )}

                      {(c.status === "draft" || c.status === "failed") && (
                        <DropdownMenuItem
                          disabled={sending === c._id}
                          onClick={() => handleSend(c._id)}
                        >
                          {sending === c._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send
                        </DropdownMenuItem>
                      )}

                      {c.status === "done" && (
                        <DropdownMenuItem
                          disabled={sending === c._id}
                          onClick={async () => await handleDuplicate(c._id)}
                        >
                          {sending === c._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          Duplicate
                        </DropdownMenuItem>
                      )}

                      {(c.status === "done" || c.status === "failed") && (
                        <DropdownMenuItem onClick={() => fetchJobs(c._id)}>
                          <Eye className="w-4 h-4" /> View Jobs
                        </DropdownMenuItem>
                      )}

                      {(c.status === "done" || c.status === "failed") &&
                        c.stats.failed > 0 && (
                          <DropdownMenuItem
                            disabled={sending === c._id}
                            onClick={() => handleRetryFailed(c._id)}
                          >
                            {sending === c._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            Retry Failed
                          </DropdownMenuItem>
                        )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="destructive"
                        disabled={c.status === "sending"}
                        onClick={() => setDeleteCampaign(c)}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmDialog
        open={!!deleteCampaign}
        onOpenChange={(open) => {
          if (!open) setDeleteCampaign(null);
        }}
        onConfirm={async () => {
          if (!deleteCampaign) return;

          await handleDelete(deleteCampaign._id);
          setDeleteCampaign(null);
        }}
      />
    </>
  );
};

export default CampaignTable;
