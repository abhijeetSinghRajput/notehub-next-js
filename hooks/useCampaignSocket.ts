import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { CampaignStats, Job } from "@/types/mailer.types";

interface UseCampaignSocketOptions {
  campaignId: string;
  onProgress?: (stats: CampaignStats) => void;
  onDone?: (stats: CampaignStats, status: "done" | "failed") => void;
  onJob?: (job: Partial<Job> & { _id: string }) => void;
}

export function useCampaignSocket({
  campaignId,
  onProgress,
  onDone,
  onJob,
}: UseCampaignSocketOptions) {
  useEffect(() => {
    if (!campaignId) return;

    const s = getSocket();
    s.emit("join:campaign", campaignId);
    if (onProgress || onDone) {
      s.emit("campaign:sync", campaignId);
    }

    const handleProgress = (data: { stats: CampaignStats }) => {
      onProgress?.(data.stats);
    };

    const handleDone = (data: {
      stats: CampaignStats;
      status: "done" | "failed";
    }) => {
      onDone?.(data.stats, data.status);
      s.emit("leave:campaign", campaignId);
    };

    const handleJob = (data: Partial<Job> & { _id: string }) => {
      onJob?.(data);
    };

    s.on("campaign:progress", handleProgress);
    s.on("campaign:done", handleDone);
    s.on("campaign:job", handleJob);

    return () => {
      s.off("campaign:progress", handleProgress);
      s.off("campaign:done", handleDone);
      s.off("campaign:job", handleJob);
      s.emit("leave:campaign", campaignId);
    };
  }, [campaignId]);
}
