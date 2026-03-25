import { create } from "zustand";
import { AxiosError } from "axios";

import { axiosInstance } from "@/lib/axios";
import type { IGetAllUsersResponse } from "@/types/model";

type UserFilter = "all" | "user" | "admin";

type UsersQuery = {
  page: number;
  limit: number;
  search: string;
  filter: UserFilter;
};

type ApiErrorResponse = {
  message?: string;
};

type CacheEntry = {
  data: IGetAllUsersResponse;
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
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  isLoadingUsers: false,
  usersError: null,
  usersCache: {},

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
      .get<IGetAllUsersResponse>("/user", {
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
}));