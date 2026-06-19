import { create } from "zustand";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import type { IUser, IGetAllUsersResponse } from "@/types/model";

type UserFilter = "all" | "user" | "admin";

type UsersQuery = {
  page: number;
  limit: number;
  search: string;
  filter: UserFilter;
};

export type HealthFilter = "all" | "good" | "warning" | "critical";

export type BlogsQuery = {
  page: number;
  limit: number;
  search: string;
  health: HealthFilter;
  indexed?: boolean | undefined;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

type ApiErrorResponse = {
  message?: string;
};

type CacheEntry = {
  data: IGetAllUsersResponse;
  updatedAt: number;
};

type SingleUserCacheEntry = {
  data: IUser;
  updatedAt: number;
};

type FetchUsersOptions = {
  force?: boolean;
  staleTime?: number;
};

const DEFAULT_STALE_TIME = 1000 * 60 * 5; // 5 min

const defaultUsersResponse: IGetAllUsersResponse = {
  users: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const normalizeQuery = (query: UsersQuery): UsersQuery => ({
  page: query.page,
  limit: query.limit,
  search: query.search.trim(),
  filter: query.filter,
});

const getCacheKey = ({ page, limit, search, filter }: UsersQuery) =>
  `${page}|${limit}|${search.toLowerCase()}|${filter}`;

const isCacheFresh = (entry: CacheEntry | undefined, staleTime: number) => {
  if (!entry) return false;
  return Date.now() - entry.updatedAt < staleTime;
};

// request dedupe outside zustand state
const inFlightRequests = new Map<string, Promise<IGetAllUsersResponse>>();

interface AdminStore {
  isLoadingUsers: boolean;
  usersError: string | null;
  usersCache: Record<string, CacheEntry>;
  singleUserCache: Record<string, SingleUserCacheEntry>;

  fetchUserByUsername: (
    username: string,
    options?: FetchUsersOptions,
  ) => Promise<IUser | null>;

  fetchUserSessions: (userId: string) => Promise<any[]>;
  terminateSession: (userId: string, sessionId: string) => Promise<boolean>;
  terminateAllSessions: (userId: string) => Promise<boolean>;
  updateUserPassword: (userId: string, password: string) => Promise<boolean>;

  fetchUsers: (
    query: UsersQuery,
    options?: FetchUsersOptions,
  ) => Promise<IGetAllUsersResponse>;

  getCachedUsers: (
    query: UsersQuery,
    staleTime?: number,
  ) => IGetAllUsersResponse | null;

  invalidateUsersCache: (query?: UsersQuery) => void;
  clearUsersCache: () => void;

  batchUpdateUsers: (
    userIds: string[],
    action: "delete" | "ban" | "unban" | "assignRole",
    role?: "user" | "admin",
  ) => Promise<{ success: boolean; message?: string }>;

  updateUser: (
    userId: string,
    data: {
      fullName?: string;
      userName?: string;
      bio?: string;
      role?: string;
      isBanned?: boolean;
      skills?: string[];
      socials?: any[];
    },
  ) => Promise<{ success: boolean; message?: string; user?: any }>;

  uploadUserAvatar: (
    userId: string,
    file: File,
  ) => Promise<{ success: boolean; user?: any }>;
  removeUserAvatar: (
    userId: string,
  ) => Promise<{ success: boolean; user?: any }>;
  uploadUserCover: (
    userId: string,
    file: File,
  ) => Promise<{ success: boolean; user?: any }>;
  removeUserCover: (
    userId: string,
  ) => Promise<{ success: boolean; user?: any }>;
  createUser: (
    data: any,
  ) => Promise<{ success: boolean; message?: string; user?: IUser }>;

  isLoadingBlogs: boolean;
  isLoadingBlogStats: boolean;
  blogsError: string | null;
  fetchBlogs: (
    query: BlogsQuery,
  ) => Promise<{ blogs: any[]; pagination: any; success: boolean }>;
  getBlogStats: () => Promise<{
    success: boolean;
    stats: {
      all: number;
      good: number;
      warning: number;
      critical: number;
    };
    gsc: {
      indexed: number;
      notIndexed: number;
      lastSynced: string;
    };
    message?: string;
  }>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  isLoadingUsers: false,
  usersError: null,
  usersCache: {},
  singleUserCache: {},

  isLoadingBlogs: false,
  isLoadingBlogStats: false,
  blogsError: null,

  fetchBlogs: async (query) => {
    set({ isLoadingBlogs: true, blogsError: null });
    try {
      const response = await axiosInstance.get("/admin/blogs", {
        params: {
          page: query.page,
          limit: query.limit,
          search: query.search,
          health: query.health,
          sortBy: query.sortBy,
          sortDirection: query.sortDirection,
          indexed: query.indexed,
        },
      });
      set({ isLoadingBlogs: false });
      return response.data;
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch blogs.";
      set({ isLoadingBlogs: false, blogsError: message });
      return {
        success: false,
        blogs: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
        },
      };
    }
  },

  getBlogStats: async () => {
    set({ isLoadingBlogStats: true });
    try {
      const response = await axiosInstance.get("/admin/blogs/stats");

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      return {
        success: false,
        stats: {
          all: 0,
          good: 0,
          warning: 0,
          critical: 0,
        },
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch stats.",
      };
    } finally {
      set({ isLoadingBlogStats: false });
    }
  },

  getCachedUsers: (query, staleTime = DEFAULT_STALE_TIME) => {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery);
    const entry = get().usersCache[cacheKey];

    if (!isCacheFresh(entry, staleTime)) return null;
    return entry.data;
  },

  fetchUsers: async (query, options = {}) => {
    const { force = false, staleTime = DEFAULT_STALE_TIME } = options;

    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery);

    const existingEntry = get().usersCache[cacheKey];

    // 1. Return fresh cache immediately
    if (!force && isCacheFresh(existingEntry, staleTime)) {
      return existingEntry!.data;
    }

    // 2. Reuse in-flight request to prevent duplicate fetching
    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight && !force) {
      return inFlight;
    }

    // 3. Only show loader if no cached data exists
    if (!existingEntry) {
      set({ isLoadingUsers: true, usersError: null });
    } else {
      set({ usersError: null });
    }

    const request = axiosInstance
      .get<IGetAllUsersResponse>("/admin/users", {
        params: {
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          search: normalizedQuery.search,
          filter: normalizedQuery.filter,
        },
      })
      .then((response) => {
        const payload = response.data;

        set((state) => ({
          isLoadingUsers: false,
          usersError: null,
          usersCache: {
            ...state.usersCache,
            [cacheKey]: {
              data: payload,
              updatedAt: Date.now(),
            },
          },
        }));

        return payload;
      })
      .catch((error) => {
        const err = error as AxiosError<ApiErrorResponse>;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch users.";

        set({
          isLoadingUsers: false,
          usersError: message,
        });

        // fallback to stale cache if available
        if (existingEntry) {
          return existingEntry.data;
        }

        return defaultUsersResponse;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });

    inFlightRequests.set(cacheKey, request);

    return request;
  },

  fetchUserByUsername: async (username, options = {}) => {
    const { force = false, staleTime = DEFAULT_STALE_TIME } = options;
    const entry = get().singleUserCache[username];

    if (!force && entry && Date.now() - entry.updatedAt < staleTime) {
      return entry.data;
    }

    set({ isLoadingUsers: true, usersError: null });

    try {
      const response = await axiosInstance.get(`/user/${username}`);
      const userData = response.data;

      set((state) => ({
        isLoadingUsers: false,
        singleUserCache: {
          ...state.singleUserCache,
          [username]: {
            data: userData,
            updatedAt: Date.now(),
          },
        },
      }));

      return userData;
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      set({
        isLoadingUsers: false,
        usersError:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch user.",
      });
      return null;
    }
  },

  fetchUserSessions: async (userId) => {
    try {
      const res = await axiosInstance.get(`/admin/users/${userId}/sessions`);
      return res.data.sessions;
    } catch (error) {
      console.error("Failed to fetch user sessions", error);
      return [];
    }
  },

  terminateSession: async (userId, sessionId) => {
    try {
      await axiosInstance.delete(
        `/admin/users/${userId}/sessions/${sessionId}`,
      );
      toast.success("Session terminated");
      return true;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to terminate session",
      );
      return false;
    }
  },

  terminateAllSessions: async (userId) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}/sessions`);
      toast.success("All sessions terminated");
      return true;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to terminate sessions",
      );
      return false;
    }
  },

  updateUserPassword: async (userId, password) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/password`, {
        password,
      });
      toast.success("Password updated successfully");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
      return false;
    }
  },

  invalidateUsersCache: (query) => {
    if (!query) {
      set({ usersCache: {} });
      return;
    }

    const normalizedQuery = normalizeQuery(query);
    const cacheKey = getCacheKey(normalizedQuery);

    set((state) => {
      const nextCache = { ...state.usersCache };
      delete nextCache[cacheKey];
      return { usersCache: nextCache };
    });
  },

  clearUsersCache: () => {
    set({ usersCache: {} });
  },

  batchUpdateUsers: async (userIds, action, role) => {
    try {
      const response = await axiosInstance.post("/admin/users/batch", {
        userIds,
        action,
        role,
      });
      get().clearUsersCache(); // invalidate cache after mutation
      return response.data;
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Batch update failed.",
      };
    }
  },

  updateUser: async (userId, data) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/users/${userId}`,
        data,
      );
      get().clearUsersCache(); // invalidate cache
      return response.data;
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          err?.response?.data?.message || err?.message || "User update failed.",
      };
    }
  },

  uploadUserAvatar: async (userId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post(
        `/admin/users/${userId}/avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success(res.data.message || "Avatar updated");
      return { success: true, user: res.data.user };
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err?.response?.data?.message || "Avatar upload failed.");
      return { success: false };
    }
  },

  removeUserAvatar: async (userId) => {
    try {
      const res = await axiosInstance.delete(`/admin/users/${userId}/avatar`);
      toast.success(res.data.message || "Avatar removed");
      return { success: true, user: res.data.user };
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err?.response?.data?.message || "Failed to remove avatar.");
      return { success: false };
    }
  },

  uploadUserCover: async (userId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post(
        `/admin/users/${userId}/cover`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success(res.data.message || "Cover updated");
      return { success: true, user: res.data.user };
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err?.response?.data?.message || "Cover upload failed.");
      return { success: false };
    }
  },

  removeUserCover: async (userId) => {
    try {
      const res = await axiosInstance.delete(`/admin/users/${userId}/cover`);
      toast.success(res.data.message || "Cover removed");
      return { success: true, user: res.data.user };
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err?.response?.data?.message || "Failed to remove cover.");
      return { success: false };
    }
  },

  createUser: async (data) => {
    try {
      const response = await axiosInstance.post("/admin/users", data);
      get().clearUsersCache(); // invalidate cache
      return response.data;
    } catch (error: any) {
      const err = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "User creation failed.",
      };
    }
  },
}));
