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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Campaign, CampaignStats, Job } from "@/types/mailer.types";
import DeliveryReport from "./_components/delivery-report";

const statusBadge: Record<
  string,
  "secondary" | "default" | "destructive" | "outline"
> = {
  draft: "secondary",
  sending: "outline",
  done: "default",
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
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    const es = new EventSource(
      `${apiBase}/api/mailer/campaigns/${campaignId}/progress`,
    );
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stats) setStats(data.stats);
        if (data.status === "done" || data.status === "failed") {
          es.close();
          onDone(campaignId, data.stats ?? stats, data.status);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [campaignId]);

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

// ─── Main Page ────────────────────────────────────────────────

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [jobsDialog, setJobsDialog] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const router = useRouter();

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
  const fetchJobs = async (id: string) => {
    setJobsDialog(id);
    setJobsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/mailer/campaigns/${id}/jobs`);
      setJobs(data.jobs);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
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
                          <DropdownMenuItem onClick={() => fetchJobs(c._id)}>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto pt-10">
          <DeliveryReport
            jobs={jobs}
            jobsLoading={jobsLoading}
            onRefresh={() => {
              if (jobsDialog) {
                fetchJobs(jobsDialog);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
