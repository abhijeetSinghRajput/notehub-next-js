"use client";

import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "@/lib/axios";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Eye,
  EllipsisVertical,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Campaign, CampaignStats, Job } from "@/types/mailer.types";
import DeliveryReport from "./_components/delivery-report";
import { useCampaignSocket } from "@/hooks/useCampaignSocket";
import { Skeleton } from "@/components/ui/skeleton";

const statusBadge: Record<
  string,
  "secondary" | "default" | "destructive" | "outline" | "success"
> = {
  draft: "secondary",
  sending: "outline",
  done: "success",
  failed: "destructive",
};

// ─── Live Progress ────────────────────────────────────────────

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
      <Progress value={pct} className="h-1.5 bg-red-500" />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [jobsDialog, setJobsDialog] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const router = useRouter();
  const [dialogPagination, setDialogPagination] = useState({
    page: 1,
    hasMore: false,
  });
  const [dialogLoadingMore, setDialogLoadingMore] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const { data } = await axiosInstance.get("/mailer/campaigns");
      setCampaigns(data.campaigns);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      await axiosInstance.post(`/mailer/campaigns/${id}/send`);
      toast.success("Campaign queued");
      setCampaigns((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "sending" } : c)),
      );
    } catch {
      toast.error("Failed to queue campaign");
    } finally {
      setSending(null);
    }
  };

  const handleResend = async (id: string) => {
    setSending(id);
    try {
      const { data } = await axiosInstance.post(
        `/mailer/campaigns/${id}/duplicate`,
      );
      toast.success("Campaign duplicated and queued");
      setCampaigns((prev) => [data.campaign, ...prev]);
    } catch {
      toast.error("Failed to resend campaign");
    } finally {
      setSending(null);
    }
  };

  const handleDone = (
    id: string,
    stats: CampaignStats,
    status: "done" | "failed",
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status, stats } : c)),
    );
    if (status === "done")
      toast.success(`Campaign sent to ${stats.sent} recipients`);
    if (status === "failed") toast.error("Campaign failed");
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/mailer/campaigns/${id}`);
      toast.success("Deleted");
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRetryFailed = async (id: string) => {
    setSending(id); // reuse existing sending state for disabled feedback
    try {
      await axiosInstance.post(`/mailer/campaigns/${id}/retry-failed`);
      toast.success("Retrying failed jobs…");
      setCampaigns((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "sending" } : c)),
      );
    } catch {
      toast.error("Failed to retry");
    } finally {
      setSending(null);
    }
  };

  const fetchJobs = async (id: string, page = 1) => {
    if (page === 1) {
      setJobsDialog(id);
      setJobsLoading(true);
    }
    try {
      const { data } = await axiosInstance.get(`/mailer/campaigns/${id}/jobs`, {
        params: { page, limit: 50 },
      });
      setJobs((prev) => (page === 1 ? data.jobs : [...prev, ...data.jobs]));
      setDialogPagination({
        page: data.pagination.currentPage,
        hasMore: data.pagination.hasNextPage,
      });
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setJobsLoading(false);
      setDialogLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-xl">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Send targeted emails to contact groups
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/campaign/new">
            <Plus className="mr-1 w-4 h-4" /> New Campaign
          </Link>
        </Button>
      </div>

      {!loading && campaigns.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-2 py-16 text-muted-foreground">
          <Mail className="w-8 h-8" />
          <p className="text-sm">No campaigns yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 20 }).map((_, i) => (
                  <TableRow key={i} className="h-13.25">
                    <TableCell>
                      <Skeleton className="w-32 h-4" />
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
                  </TableRow>
                ))
              : campaigns.map((c) => (
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
                            value={Math.round(
                              (c.stats.sent / c.stats.total) * 100,
                            )}
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

                            {(c.status === "draft" ||
                              c.status === "failed") && (
                              <DropdownMenuItem
                                disabled={sending === c._id}
                                onClick={() => handleSend(c._id)}
                              >
                                <Send className="w-4 h-4" /> Send
                              </DropdownMenuItem>
                            )}

                            {c.status === "done" && (
                              <DropdownMenuItem
                                disabled={sending === c._id}
                                onClick={() => handleResend(c._id)}
                              >
                                {sending === c._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}{" "}
                                Resend
                              </DropdownMenuItem>
                            )}

                            {(c.status === "done" || c.status === "failed") && (
                              <DropdownMenuItem
                                onClick={() => fetchJobs(c._id)}
                              >
                                <Eye className="w-4 h-4" /> View Jobs
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              variant="destructive"
                              disabled={c.status === "sending"}
                              onClick={() => handleDelete(c._id)}
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
      )}

      <Dialog open={!!jobsDialog} onOpenChange={() => setJobsDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[70vh] px-4 overflow-y-auto pt-10">
          <DeliveryReport
            jobs={jobs}
            jobsLoading={jobsLoading}
            onRefresh={() => jobsDialog && fetchJobs(jobsDialog, 1)}
            hasMore={dialogPagination.hasMore}
            onLoadMore={() => {
              setDialogLoadingMore(true);
              jobsDialog && fetchJobs(jobsDialog, dialogPagination.page + 1);
            }}
            loadingMore={dialogLoadingMore}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
