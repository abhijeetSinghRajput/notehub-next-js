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
  Trash,
  X,
} from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { Campaign, CampaignStats } from "@/types/mailer.types";
import { useCampaignSocket } from "@/hooks/useCampaignSocket";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/app/stores/useCampaignStore";
import { useState } from "react";
import DeleteConfirmDialog from "./delete-confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
  onViewJobs: (id: string) => void;
}

const CampaignTable = ({ onViewJobs }: CampaignTableProps) => {
  const router = useRouter();
  const {
    campaigns,
    fetchingCampaign,
    sendingId,
    duplicatingId,
    deletingId,
    retryingId,
    bulkActionLoading,
    handleSend,
    handleDuplicate,
    handleDelete,
    handleDone,
    handleRetryFailed,
    handleBulkDelete,
    handleBulkRetryFailed,
  } = useCampaignStore();
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (fetchingCampaign) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="size-5 border rounded-sm" />
            </TableHead>
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
                <Skeleton className="size-5 border rounded-sm" />
              </TableCell>
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

  const toggleSelectAll = () => {
    if (selectedIds.length === campaigns.length && campaigns.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaigns.map((u) => u._id));
    }
  };

  const toggleSelectCampaign = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // Only campaigns with failed jobs are eligible for bulk retry
  const selectedHasRetryable = campaigns.some(
    (c) => selectedIds.includes(c._id) && c.stats.failed > 0,
  );

  const handleBulkRetryClick = async () => {
    await handleBulkRetryFailed(selectedIds);
    clearSelection();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <Checkbox
                checked={
                  campaigns.length > 0 &&
                  selectedIds.length === campaigns.length
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
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
          {campaigns.map((c) => {
            const isChecked = selectedIds.includes(c._id as string);
            return (
              <TableRow
                key={c._id}
                onClick={() => router.push(`/admin/campaign/${c._id}`)}
                className={cn("cursor-pointer", isChecked && "bg-muted/50")}
              >
                <TableCell
                  className="text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() =>
                      toggleSelectCampaign(c._id as string)
                    }
                    className="cursor-pointer hover:border-foreground/50"
                  />
                </TableCell>
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
                        {c.stats.sent} / sent · {c.stats.failed} failed ·{" "}
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
                            disabled={sendingId === c._id}
                            onClick={() => handleSend(c._id)}
                          >
                            {sendingId === c._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Send
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          disabled={duplicatingId === c._id}
                          onClick={async () => await handleDuplicate(c._id)}
                        >
                          {duplicatingId === c._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          Duplicate
                        </DropdownMenuItem>

                        {(c.status === "done" || c.status === "failed") && (
                          <DropdownMenuItem onClick={() => onViewJobs(c._id)}>
                            <Eye className="w-4 h-4" /> View Jobs
                          </DropdownMenuItem>
                        )}

                        {(c.status === "done" || c.status === "failed") &&
                          c.stats.failed > 0 && (
                            <DropdownMenuItem
                              disabled={retryingId === c._id}
                              onClick={() => handleRetryFailed(c._id)}
                            >
                              {retryingId === c._id ? (
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
                          disabled={
                            c.status === "sending" || deletingId === c._id
                          }
                          onClick={() => setDeleteCampaign(c)}
                        >
                          {deletingId === c._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* ── BATCH ACTIONS BAR ── */}
      {selectedIds.length > 0 && (
        <div className="border-t min-h-16 z-50 sticky bottom-0 slide-in-from-bottom-2 bg-card px-4 py-3  transition-all animate-in fade-in">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <span className="mr-auto pl-2 font-medium text-sm">
              {selectedIds.length} campaign(s) selected
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!selectedHasRetryable || bulkActionLoading}
              onClick={handleBulkRetryClick}
            >
              {bulkActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Retry Failed
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              disabled={bulkActionLoading}
              onClick={() => setBulkDeleteOpen(true)}
            >
              {bulkActionLoading ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : (
                <Trash className="mr-2 w-4 h-4" />
              )}
              Delete
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={clearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── SINGLE MOUNTED DELETE DIALOG, shared for row delete + bulk delete ── */}
      <DeleteConfirmDialog
        open={!!deleteCampaign || bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCampaign(null);
            setBulkDeleteOpen(false);
          }
        }}
        title={
          bulkDeleteOpen
            ? `Delete ${selectedIds.length} campaigns?`
            : "Delete campaign?"
        }
        description={
          bulkDeleteOpen
            ? "This action cannot be undone. The selected campaigns will be permanently deleted."
            : "This action cannot be undone. The campaign will be permanently deleted."
        }
        onConfirm={async () => {
          if (bulkDeleteOpen) {
            await handleBulkDelete(selectedIds);
            setBulkDeleteOpen(false);
            clearSelection();
            return;
          }
          if (!deleteCampaign) return;
          await handleDelete(deleteCampaign._id);
          setDeleteCampaign(null);
        }}
      />
    </>
  );
};

export default CampaignTable;
