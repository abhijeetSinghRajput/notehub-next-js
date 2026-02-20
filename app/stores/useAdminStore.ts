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

type ApiErrorResponse = { message?: string };

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

const getCacheKey = ({ page, limit, search, filter }: UsersQuery) =>
  `${page}|${limit}|${search.trim().toLowerCase()}|${filter}`;

interface AdminStore {
  isLoadingUsers: boolean;
  usersError: string | null;
  usersCache: Record<string, IGetAllUsersResponse>;
  fetchUsers: (
    query: UsersQuery,
    options?: { force?: boolean },
  ) => Promise<IGetAllUsersResponse>;
  getCachedUsers: (query: UsersQuery) => IGetAllUsersResponse | null;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  isLoadingUsers: false,
  usersError: null,
  usersCache: {},

  getCachedUsers: (query) => {
    const cacheKey = getCacheKey(query);
    return get().usersCache[cacheKey] ?? null;
  },

  fetchUsers: async (query, options = {}) => {
    const cacheKey = getCacheKey(query);
    const cached = get().usersCache[cacheKey];

    if (cached && !options.force) {
      return cached;
    }

    set({ isLoadingUsers: true, usersError: null });

    try {
      const response = await axiosInstance.get<IGetAllUsersResponse>("/user", {
        params: {
          page: query.page,
          limit: query.limit,
          search: query.search,
          filter: query.filter,
        },
      });

      const payload = response.data;

      set((state) => ({
        isLoadingUsers: false,
        usersError: null,
        usersCache: {
          ...state.usersCache,
          [cacheKey]: payload,
        },
      }));

      return payload;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      const message =
        err?.response?.data?.message || err?.message || "Failed to fetch users.";

      set({
        isLoadingUsers: false,
        usersError: message,
      });

      return defaultUsersResponse;
    }
  },
}));
