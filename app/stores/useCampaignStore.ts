import { create } from "zustand";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { Campaign, CampaignStats, Job } from "@/types/mailer.types";
import { axiosInstance } from "@/lib/axios";

interface CampaignState {
  campaigns: Campaign[];
  fetchingCampaign: boolean;

  sendingId: string | null;
  duplicatingId: string | null;
  deletingId: string | null;
  retryingId: string | null;
  bulkActionLoading: boolean;

  currentPage: number;
  itemsPerPage: number;
  totalItems: number;

  jobs: Job[];
  jobsLoading: boolean;
  jobsLoadingMore: boolean;
  jobsPagination: { page: number; hasMore: boolean };
  jobsFilter: { status?: string; sortBy?: string; sortOrder?: string };

  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  setJobsFilter: (f: { status?: string; sortBy?: string; sortOrder?: string }) => void;
  setJobs: (updater: (prev: Job[]) => Job[]) => void;

  fetchCampaigns: (page?: number, limit?: number) => Promise<void>;
  handleSend: (id: string) => Promise<void>;
  handleDuplicate: (id: string) => Promise<void>;
  handleDone: (id: string, stats: CampaignStats, status: "done" | "failed") => void;
  handleDelete: (id: string) => Promise<boolean>;
  handleRetryFailed: (id: string) => Promise<void>;
  fetchJobs: (
    id: string,
    page?: number,
    params?: { status?: string; sortBy?: string; sortOrder?: string },
  ) => Promise<void>;
  handleBulkDelete: (ids: string[]) => Promise<boolean>;
  handleBulkRetryFailed: (ids: string[]) => Promise<void>;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  fetchingCampaign: true,

  sendingId: null,
  duplicatingId: null,
  deletingId: null,
  retryingId: null,
  bulkActionLoading: false,

  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0,

  jobs: [],
  jobsLoading: false,
  jobsLoadingMore: false,
  jobsPagination: { page: 1, hasMore: false },
  jobsFilter: {},

  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (limit) => set({ itemsPerPage: limit }),
  setJobsFilter: (f) => set({ jobsFilter: f }),
  setJobs: (updater) => set((state) => ({ jobs: updater(state.jobs) })),

  fetchCampaigns: async (page, limit) => {
    const { currentPage, itemsPerPage } = get();
    const p = page ?? currentPage;
    const l = limit ?? itemsPerPage;
    try {
      set({ fetchingCampaign: true });
      const { data } = await axiosInstance.get("/mailer/campaigns", {
        params: { page: p, limit: l },
      });
      set({ campaigns: data.campaigns, totalItems: data.pagination.totalItems });
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      set({ fetchingCampaign: false });
    }
  },

  handleSend: async (id) => {
    set({ sendingId: id });
    try {
      await axiosInstance.post(`/mailer/campaigns/${id}/send`);
      toast.success("Campaign queued");
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c._id === id ? { ...c, status: "sending" } : c,
        ),
      }));
    } catch {
      toast.error("Failed to queue campaign");
    } finally {
      set({ sendingId: null });
    }
  },

  handleDuplicate: async (id) => {
    set({ duplicatingId: id });
    try {
      const { data } = await axiosInstance.post(`/mailer/campaigns/${id}/duplicate`);
      const newCampaignId = data.campaign._id;
      getSocket().emit("join:campaign", newCampaignId);
      toast.success("Campaign duplicated");
      set((state) => ({ campaigns: [data.campaign, ...state.campaigns] }));
    } catch {
      toast.error("Failed to duplicate campaign");
    } finally {
      set({ duplicatingId: null });
    }
  },

  handleDone: (id, stats, status) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c._id === id ? { ...c, status, stats } : c,
      ),
    }));
    if (status === "done") toast.success(`Campaign sent to ${stats.sent} recipients`);
    if (status === "failed") toast.error("Campaign failed");
  },

  handleDelete: async (id) => {
    set({ deletingId: id });
    try {
      await axiosInstance.delete(`/mailer/campaigns/${id}`);
      toast.success("Deleted");
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c._id !== id),
      }));
      return true;
    } catch {
      toast.error("Failed to delete");
      return false;
    } finally {
      set({ deletingId: null });
    }
  },

  handleRetryFailed: async (id) => {
    set({ retryingId: id });
    try {
      await axiosInstance.post(`/mailer/campaigns/${id}/retry-failed`);
      toast.success("Retrying failed jobs…");
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c._id === id ? { ...c, status: "sending" } : c,
        ),
      }));
    } catch {
      toast.error("Failed to retry");
    } finally {
      set({ retryingId: null });
    }
  },

  handleBulkDelete: async (ids) => {
    set({ bulkActionLoading: true });
    try {
      const { data } = await axiosInstance.post("/mailer/campaigns/bulk-delete", { ids });
      toast.success(`Deleted ${data.deletedCount} campaign${data.deletedCount === 1 ? "" : "s"}`);
      set((state) => ({
        campaigns: state.campaigns.filter((c) => !ids.includes(c._id)),
        totalItems: state.totalItems - data.deletedCount,
      }));
      return true;
    } catch {
      toast.error("Failed to delete campaigns");
      return false;
    } finally {
      set({ bulkActionLoading: false });
    }
  },

  handleBulkRetryFailed: async (ids) => {
    set({ bulkActionLoading: true });
    try {
      const { data } = await axiosInstance.post("/mailer/campaigns/bulk-retry-failed", { ids });
      const retriedIds: string[] = data.retriedIds ?? ids;
      toast.success(`Retrying failed jobs for ${retriedIds.length} campaign${retriedIds.length === 1 ? "" : "s"}…`);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          retriedIds.includes(c._id) ? { ...c, status: "sending" } : c,
        ),
      }));
    } catch {
      toast.error("Failed to retry campaigns");
    } finally {
      set({ bulkActionLoading: false });
    }
  },

  fetchJobs: async (id, page = 1, params = {}) => {
    const { jobsFilter } = get();
    const merged = { ...jobsFilter, ...params };

    if (page === 1) set({ jobsLoading: true, jobs: [] });
    else set({ jobsLoadingMore: true });

    try {
      const { data } = await axiosInstance.get(`/mailer/campaigns/${id}/jobs`, {
        params: { page, limit: 50, ...merged },
      });
      set((state) => ({
        jobs: page === 1 ? data.jobs : [...state.jobs, ...data.jobs],
        jobsPagination: {
          page: data.pagination.currentPage,
          hasMore: data.pagination.hasNextPage,
        },
      }));
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      set({ jobsLoading: false, jobsLoadingMore: false });
    }
  },
}));