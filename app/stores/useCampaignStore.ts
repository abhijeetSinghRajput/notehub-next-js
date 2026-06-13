import { create } from "zustand";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { Campaign, CampaignStats, Job } from "@/types/mailer.types";
import { axiosInstance } from "@/lib/axios";

interface CampaignState {
  campaigns: Campaign[];
  loading: boolean;
  sending: string | null;

  currentPage: number;
  itemsPerPage: number;
  totalItems: number;

  jobsDialog: string | null;
  jobs: Job[];
  jobsLoading: boolean;
  dialogPagination: { page: number; hasMore: boolean };
  dialogLoadingMore: boolean;

  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  setJobsDialog: (id: string | null) => void;

  fetchCampaigns: (page?: number, limit?: number) => Promise<void>;
  handleSend: (id: string) => Promise<void>;
  handleDuplicate: (id: string) => Promise<void>;
  handleDone: (
    id: string,
    stats: CampaignStats,
    status: "done" | "failed",
  ) => void;
  handleDelete: (id: string) => Promise<boolean>;
  handleRetryFailed: (id: string) => Promise<void>;
  fetchJobs: (id: string, page?: number) => Promise<void>;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  loading: true,
  sending: null,

  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0,

  jobsDialog: null,
  jobs: [],
  jobsLoading: false,
  dialogPagination: { page: 1, hasMore: false },
  dialogLoadingMore: false,

  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (limit) => set({ itemsPerPage: limit }),
  setJobsDialog: (id) => set({ jobsDialog: id }),

  fetchCampaigns: async (page, limit) => {
    const { currentPage, itemsPerPage } = get();
    const p = page ?? currentPage;
    const l = limit ?? itemsPerPage;
    try {
      set({ loading: true });
      const { data } = await axiosInstance.get("/mailer/campaigns", {
        params: { page: p, limit: l },
      });
      set({
        campaigns: data.campaigns,
        totalItems: data.pagination.totalItems,
      });
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      set({ loading: false });
    }
  },

  handleSend: async (id) => {
    set({ sending: id });
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
      set({ sending: null });
    }
  },

  handleDuplicate: async (id) => {
    set({ sending: id });
    try {
      const { data } = await axiosInstance.post(
        `/mailer/campaigns/${id}/duplicate`,
      );

      const newCampaignId = data.campaign._id;
      getSocket().emit("join:campaign", newCampaignId);

      toast.success("Campaign duplicated");
      set((state) => ({ campaigns: [data.campaign, ...state.campaigns] }));
    } catch {
      toast.error("Failed to resend campaign");
    } finally {
      set({ sending: null });
    }
  },

  handleDone: (id, stats, status) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c._id === id ? { ...c, status, stats } : c,
      ),
    }));
    if (status === "done")
      toast.success(`Campaign sent to ${stats.sent} recipients`);
    if (status === "failed") toast.error("Campaign failed");
  },

  handleDelete: async (id) => {
    set({ sending: id });
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
      set({ sending: null });
    }
  },

  handleRetryFailed: async (id) => {
    set({ sending: id });
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
      set({ sending: null });
    }
  },

  fetchJobs: async (id, page = 1) => {
    if (page === 1) {
      set({ jobsDialog: id, jobsLoading: true });
    } else {
      set({ dialogLoadingMore: true });
    }
    try {
      const { data } = await axiosInstance.get(`/mailer/campaigns/${id}/jobs`, {
        params: { page, limit: 50 },
      });
      set((state) => ({
        jobs: page === 1 ? data.jobs : [...state.jobs, ...data.jobs],
        dialogPagination: {
          page: data.pagination.currentPage,
          hasMore: data.pagination.hasNextPage,
        },
      }));
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      set({ jobsLoading: false, dialogLoadingMore: false });
    }
  },
}));
