"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Send,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Check,
} from "lucide-react";
import Link from "next/link";
import JsonPreviewCard from "../_components/json-preview-card";
import DeliveryReport from "../_components/delivery-report";
import CampaignDetails from "../_components/CampaignDetails";
import { Campaign, Job } from "@/types/mailer.types";
import { useCampaignSocket } from "@/hooks/useCampaignSocket";

const statusConfig: Record<
  string,
  {
    variant: "secondary" | "default" | "destructive" | "outline";
    icon: React.ElementType;
    label: string;
  }
> = {
  draft: { variant: "secondary", icon: FileText, label: "Draft" },
  sending: { variant: "outline", icon: Loader2, label: "Sending" },
  done: { variant: "default", icon: Check, label: "Completed" },
  failed: { variant: "destructive", icon: XCircle, label: "Failed" },
};

// ─── Page ──────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/mailer/campaigns/${id}/jobs`);
      setJobs(data.jobs);
    } catch {
      toast.error("Failed to load delivery jobs");
    } finally {
      setJobsLoading(false);
    }
  }, [id]);

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
          // update existing (e.g. pending → sent/failed)
          const updated = [...prev];
          updated[exists] = { ...updated[exists], ...job };
          return updated;
        }
        // append new
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

  const handleSend = async () => {
    setSending(true);
    try {
      await axiosInstance.post(`/mailer/campaigns/${id}/send`);
      toast.success("Campaign dispatched");
      fetchCampaign();
    } catch {
      toast.error("Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/mailer/campaigns/${id}`);
      toast.success("Campaign deleted");
      router.push("/admin/campaign");
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
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
  const canSend = campaign.status === "draft" || campaign.status === "failed";
  const hasStats = campaign.status !== "draft";
  const sentPercent = hasStats
    ? Math.round((campaign.stats.sent / campaign.stats.total) * 100)
    : 0;
  const failedPercent = hasStats
    ? Math.round((campaign.stats.failed / campaign.stats.total) * 100)
    : 0;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
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
          {canSend && (
            <Button
              size="icon"
              onClick={handleSend}
              tooltip="send"
              disabled={sending}
            >
              {sending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          )}
          {campaign.status !== "sending" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  tooltip="delete"
                  size="icon"
                  disabled={deleting}
                >
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{campaign.name}&rdquo;
                    and all its delivery jobs. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {deleting ? (
                      <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Separator />

      {/* Stats cards — only when campaign has been sent */}
      {hasStats && (
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-2xl">{campaign.stats.total}</p>
              <p className="text-muted-foreground text-xs">recipients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-emerald-600 text-2xl">
                {campaign.stats.sent}
              </p>
              <p className="text-muted-foreground text-xs">
                {sentPercent}% success
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-500" /> Failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-red-600 text-2xl">
                {campaign.stats.failed}
              </p>
              <p className="text-muted-foreground text-xs">
                {failedPercent}% failure
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        <CampaignDetails campaign={campaign} />
        <JsonPreviewCard json={campaign.extraJson} />
      </div>

      {["done", "failed", "sending"].includes(campaign.status) && (
        <DeliveryReport
          jobs={jobs}
          jobsLoading={jobsLoading}
          onRefresh={fetchJobs}
        />
      )}
    </div>
  );
}
