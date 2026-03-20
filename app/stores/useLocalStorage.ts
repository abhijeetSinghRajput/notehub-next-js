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

  pinnedCollections: [],
  togglePinnedCollection: (collectionId) => {
    const { pinnedCollections } = get();
    set({
      pinnedCollections: pinnedCollections.includes(collectionId)
        ? pinnedCollections.filter((id) => id !== collectionId)
        : [...pinnedCollections, collectionId],
    });
  },

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

// SSR-safe localStorage storage
const storage = createJSONStorage(() =>
  typeof window !== "undefined"
    ? window.localStorage
    : ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as unknown as Storage)
);

export const useLocalStorage = create<LocalStorageState>()(
  persist(localStorageCreator, {
    name: "local-storage-state",
    storage,
    onRehydrateStorage: () => (state) => {
      if (state?.theme && typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", state.theme);
      }
    },
  })
);