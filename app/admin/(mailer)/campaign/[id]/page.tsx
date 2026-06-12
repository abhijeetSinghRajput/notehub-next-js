"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Send,
  Trash2,
  FileText,
  XCircle,
  AlertCircle,
  Check,
  RotateCcw,
  EllipsisVertical,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import CampaignCodeCard from "../_components/campaign-code-card";
import DeliveryReport from "../_components/delivery-report";
import CampaignDetails from "../_components/CampaignDetails";
import { Campaign, Job } from "@/types/mailer.types";
import { useCampaignSocket } from "@/hooks/useCampaignSocket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCampaignStore } from "@/app/stores/useCampaignStore";
import CampaignStatsCards from "../_components/campaign-stats-cards";

const statusConfig: Record<
  string,
  {
    variant: "secondary" | "default" | "destructive" | "outline" | "success";
    icon: React.ElementType;
    label: string;
  }
> = {
  draft: { variant: "secondary", icon: FileText, label: "Draft" },
  sending: { variant: "outline", icon: Loader2, label: "Sending" },
  done: { variant: "success", icon: Check, label: "Completed" },
  failed: { variant: "destructive", icon: XCircle, label: "Failed" },
};

// ─── Page ──────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [jobsPagination, setJobsPagination] = useState({
    page: 1,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { sending, handleSend, handleDelete, handleRetryFailed } =
    useCampaignStore();

  const fetchCampaign = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(`/mailer/campaigns/${id}`);
      setCampaign(data.campaign);
    } catch {
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchJobs = useCallback(
    async (page = 1) => {
      if (page === 1) setJobsLoading(true);
      try {
        const { data } = await axiosInstance.get(
          `/mailer/campaigns/${id}/jobs`,
          { params: { page, limit: 50 } },
        );
        setJobs((prev) => (page === 1 ? data.jobs : [...prev, ...data.jobs]));
        setJobsPagination({
          page: data.pagination.currentPage,
          hasMore: data.pagination.hasNextPage,
        });
      } catch {
        toast.error("Failed to load jobs");
      } finally {
        setJobsLoading(false);
        setJobsLoadingMore(false);
      }
    },
    [id],
  );

  const handleJobsLoadMore = () => {
    setJobsLoadingMore(true);
    fetchJobs(jobsPagination.page + 1);
  };

  useCampaignSocket({
    campaignId: campaign ? id : "",
    onProgress: (stats) => {
      setCampaign((prev) => (prev ? { ...prev, stats } : prev));
    },
    onDone: (stats, status) => {
      setCampaign((prev) => (prev ? { ...prev, stats, status } : prev));
      if (status === "done") toast.success(`Sent to ${stats.sent} recipients`);
      if (status === "failed") toast.error("Campaign failed");
    },
    onJob: (job) => {
      setJobs((prev) => {
        const exists = prev.findIndex((j) => j._id === job._id);
        if (exists !== -1) {
          const updated = [...prev];
          updated[exists] = { ...updated[exists], ...job };
          return updated;
        }
        return [...prev, job as Job];
      });
    },
  });

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    if (
      campaign &&
      (campaign.status === "done" ||
        campaign.status === "failed" ||
        campaign.status === "sending")
    ) {
      fetchJobs();
    }
  }, [campaign?.status, fetchJobs]);

  const onSend = async () => {
    if (!campaign) return;
    await handleSend(campaign._id);
    setCampaign((prev) => (prev ? { ...prev, status: "sending" } : prev));
  };

  const onRetryFailed = async () => {
    if (!campaign) return;
    await handleRetryFailed(campaign._id);
    setCampaign((prev) => (prev ? { ...prev, status: "sending" } : prev));
  };

  const onDelete = async () => {
    if (!campaign) return;
    const ok = await handleDelete(campaign._id);
    if (ok) router.push("/admin/campaign");
  };

  // ─── Loading state ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col justify-center items-center gap-3 py-24 text-muted-foreground">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">Campaign not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/campaign">
            <ArrowLeft className="mr-1.5 w-4 h-4" /> Back to campaigns
          </Link>
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[campaign.status];
  const StatusIcon = statusInfo.icon;
  const isSending = sending === campaign._id;
  const canSend = campaign.status === "draft" || campaign.status === "failed";
  const canRetry =
    (campaign.status === "done" || campaign.status === "failed") &&
    campaign.stats.failed > 0;
  const canEdit = campaign.status === "draft" || campaign.status === "failed";
  const canDelete = campaign.status !== "sending";
  const hasStats = campaign.status !== "draft";
  const hasDropdownActions = canEdit || canSend || canRetry;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex flex-col-reverse sm:flex-row items-start gap-2">
            <h1 className="font-semibold text-xl">{campaign.name}</h1>
            <Badge variant={statusInfo.variant} className="gap-1">
              <StatusIcon
                className={`w-3 h-3 ${campaign.status === "sending" ? "animate-spin" : ""}`}
              />
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Created{" "}
            {new Date(campaign.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasDropdownActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  {isSending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <EllipsisVertical />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/admin/campaign/${campaign._id}/edit`)
                    }
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </DropdownMenuItem>
                )}

                {canSend && (
                  <DropdownMenuItem disabled={isSending} onClick={onSend}>
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </DropdownMenuItem>
                )}

                {canRetry && (
                  <DropdownMenuItem
                    disabled={isSending}
                    onClick={onRetryFailed}
                  >
                    {isSending ? (
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
                  disabled={!canDelete}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="icon"
              variant="destructive"
              tooltip="Delete"
              disabled={!canDelete}
              onClick={() => setDeleteOpen(true)}
            >
              {isSending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Stats cards — only when campaign has been sent */}
      {hasStats && (
        <CampaignStatsCards
          total={campaign.stats.total}
          failed={campaign.stats.failed}
          sent={campaign.stats.sent}
        />
      )}

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        <CampaignDetails campaign={campaign} />
        <CampaignCodeCard json={campaign.extraJson} html={campaign.htmlBody} />
      </div>

      {["done", "failed", "sending"].includes(campaign.status) && (
        <DeliveryReport
          jobs={jobs}
          jobsLoading={jobsLoading}
          onRefresh={() => fetchJobs(1)}
          hasMore={jobsPagination.hasMore}
          onLoadMore={handleJobsLoadMore}
          loadingMore={jobsLoadingMore}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{campaign.name}&rdquo; and all
              its delivery jobs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSending ? (
                <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
