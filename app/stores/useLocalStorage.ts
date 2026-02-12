// stores/useLocalStorage.ts
import { create, type StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SearchHistoryUser {
  _id: string;
  [key: string]: unknown;
}

export interface LocalStorageState {
  searchHistory: SearchHistoryUser[];
  addSearchHistory: (user: SearchHistoryUser) => void;
  removeSearchHistory: (userId: string) => void;
  clearSearchHistory: () => void;

  openedCollections: Record<string, boolean>;
  toggleCollection: (collectionId: string, isExpanded: boolean) => void;
  collapseAll: () => void;
  expandAll: (collectionIds: string[]) => void;

  pinnedCollections: string[];
  togglePinnedCollection: (collectionId: string) => void;

  theme: string;
  setTheme: (newTheme: string) => void;
}

const localStorageCreator: StateCreator<LocalStorageState> = (set, get) => ({
  // Search history state
  searchHistory: [],
  addSearchHistory: (user) => {
    const newHistory = [
      user,
      ...get().searchHistory.filter((item) => item._id !== user._id),
    ].slice(0, 5);
    set({ searchHistory: newHistory });
  },
  removeSearchHistory: (userId) => {
    set({
      searchHistory: get().searchHistory.filter((item) => item._id !== userId),
    });
  },
  clearSearchHistory: () => {
    set({ searchHistory: [] });
  },

  // Collections state
  openedCollections: {},
  toggleCollection: (collectionId, isExpanded) => {
    set({
      openedCollections: {
        ...get().openedCollections,
        [collectionId]: isExpanded,
      },
    });
  },
  collapseAll: () => {
    set({ openedCollections: {} });
  },
  expandAll: (collectionIds) => {
    const expandedState = collectionIds.reduce<Record<string, boolean>>(
      (acc, id) => ({ ...acc, [id]: true }),
      {},
    );
    set({ openedCollections: expandedState });
  },

  // Pinned collections
  pinnedCollections: [],
  togglePinnedCollection: (collectionId) => {
    const { pinnedCollections } = get();
    set({
      pinnedCollections: pinnedCollections.includes(collectionId)
        ? pinnedCollections.filter((id) => id !== collectionId)
        : [...pinnedCollections, collectionId],
    });
  },

  // Theme state
  theme: "zinc",
  setTheme: (newTheme) => {
    set({ theme: newTheme });
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute(
        "data-theme",
        newTheme.toLowerCase(),
      );
    }
  },
});


export const useLocalStorage = create<LocalStorageState>()(
  persist(
    localStorageCreator,
    {
      name: "local-storage-state",
      storage: createJSONStorage(() => window.localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);
