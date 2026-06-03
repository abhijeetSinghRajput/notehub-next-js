"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Mail,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import Link from "next/link";
import hljs from "highlight.js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Types ─────────────────────────────────────────────────────

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  htmlBody: string;

  emails: string[];

  status: "draft" | "sending" | "done" | "failed";

  extraJson: Record<string, unknown>;

  stats: {
    total: number;
    sent: number;
    failed: number;
  };

  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  email: string;
  status: "pending" | "sent" | "failed";
  userId: {
    _id: string;
    fullName: string;
    userName: string;
    email: string;
    avatar: string;
  } | null;
  error: string | null;
  processedAt: string | null;
  createdAt: string;
}

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

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    if (campaign && (campaign.status === "done" || campaign.status === "failed" || campaign.status === "sending")) {
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
  const canSend =
    campaign.status === "draft" || campaign.status === "failed";
  const emails = campaign.emails ?? [];
  const emailCount = emails.length;
  const hasStats = campaign.status !== "draft";
  const sentPercent = hasStats
    ? Math.round((campaign.stats.sent / campaign.stats.total) * 100)
    : 0;
  const failedPercent = hasStats
    ? Math.round((campaign.stats.failed / campaign.stats.total) * 100)
    : 0;

  const jsonString = JSON.stringify(campaign.extraJson ?? {}, null, 2);

  const highlighted = hljs.highlight(jsonString, {
    language: "json",
  }).value;

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
            Created {new Date(campaign.createdAt).toLocaleDateString("en-US", {
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
            <Button size="icon" onClick={handleSend} tooltip="send" disabled={sending}>
              {sending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
            </Button>
          )}
          {campaign.status !== "sending" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" tooltip="delete" size="icon" disabled={deleting}>
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{campaign.name}&rdquo; and all its
                    delivery jobs. This action cannot be undone.
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
              <p className="text-muted-foreground text-xs">{sentPercent}% success</p>
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
              <p className="text-muted-foreground text-xs">{failedPercent}% failure</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign info */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 font-medium text-sm">
              <Mail className="w-4 h-4" /> Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="gap-y-2.5 grid grid-cols-[100px_1fr] text-sm">
              <span className="text-muted-foreground">Subject</span>
              <span className="font-medium">
                {campaign.subject || "—"}
              </span>

              <span className="text-muted-foreground">Recipients</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between gap-2 text-left font-medium text-foreground hover:text-foreground/80 transition-colors"
                  >
                    <span>
                      {emailCount} recipient{emailCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex flex-col leading-none text-muted-foreground">
                      <ChevronUp className="w-3.5 h-3.5 -mb-0.5" />
                      <ChevronDown className="w-3.5 h-3.5 -mt-0.5" />
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Recipients</DialogTitle>
                    <DialogDescription>
                      All email addresses included in this campaign.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-80 overflow-y-auto rounded-md border bg-muted/20 p-3">
                    {emailCount > 0 ? (
                      <div className="space-y-1.5">
                        {emails.map((email, index) => (
                          <div
                            key={`${email}-${index}`}
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                          >
                            {email}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No recipients available
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <span className="text-muted-foreground">Sent At</span>
              <span>
                {campaign.sentAt
                  ? new Date(campaign.sentAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Extra JSON card */}
        <div className="flex flex-col border rounded-md max-h-60 overflow-hidden">
          <div className="top-0 sticky bg-[#222222] p-2 border-[#444] border-b text-muted-foreground text-xs">Extra Data (JSON)</div>
          {campaign.extraJson &&
            Object.keys(campaign.extraJson).length > 0 ? (
            <pre
              className="flex-1 bg-[#181818] p-3 overflow-auto font-mono text-white text-xs break-all leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          ) : (
            <p className="text-muted-foreground text-sm p-4 text-center">No extra data</p>
          )}
        </div>

      </div>

      {/* Delivery Jobs */}
      {(campaign.status === "done" ||
        campaign.status === "failed" ||
        campaign.status === "sending") && (
          <div>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Users className="w-4 h-4" /> Delivery Report
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchJobs}
                  disabled={jobsLoading}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-1.5 ${jobsLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
              {jobs.length > 0 && (
                <div className="text-muted-foreground text-sm">
                  {jobs.filter((j) => j.status === "sent").length} sent ·{" "}
                  {jobs.filter((j) => j.status === "failed").length} failed ·{" "}
                  {jobs.filter((j) => j.status === "pending").length} pending
                </div>
              )}
            </div>
            <div className="bg-card">
              {jobsLoading && jobs.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Clock className="w-6 h-6" />
                  <p className="text-sm">No delivery jobs yet</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed At</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job._id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {job.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                job.status === "sent"
                                  ? "default"
                                  : job.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {job.processedAt
                              ? new Date(job.processedAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-50 text-muted-foreground text-xs truncate">
                            {job.error ?
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <AlertCircle />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-auto max-w-md">
                                  <p className="text-destructive text-sm">{job.error}</p>
                                </PopoverContent>
                              </Popover>
                              : "—"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}

    </div>
  );
}
