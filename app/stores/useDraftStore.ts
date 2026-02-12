import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { INote } from "@/types/model";

interface DraftState {
  drafts: Record<string, Record<string, INote>>;

  getDraft: (noteId: string) => INote | null;
  setDraft: (noteId: string, data: INote) => void;
  clearDraft: (noteId: string) => void;
  clearUserDrafts: () => void;
  clearAllDrafts: () => void;
}

/* ================= STORE ================= */

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      // ✅ Get draft by noteId
      getDraft: (noteId: string) => {
        const { authUser } = useAuthStore.getState();
        if (!authUser?._id) return null;

        return get().drafts[authUser._id]?.[noteId] ?? null;
      },

      // ✅ Set / update draft
      setDraft: (noteId: string, data: INote) => {
        const { authUser } = useAuthStore.getState();
        if (!authUser?._id) return;

        const userId = authUser._id;

        set((state: DraftState) => ({
          drafts: {
            ...state.drafts,
            [userId]: {
              ...state.drafts[userId],
              [noteId]: {
                ...(state.drafts[userId]?.[noteId] ?? {}),
                ...data,
                updatedAt: new Date(),
              },
            },
          },
        }));
      },

      // ✅ Clear one draft
      clearDraft: (noteId: string) => {
        const { authUser } = useAuthStore.getState();
        if (!authUser?._id) return;

        const userId = authUser._id;

        set((state: DraftState) => {
          if (!state.drafts[userId]) return state;

          const userDrafts = { ...state.drafts[userId] };
          delete userDrafts[noteId];

          return {
            drafts: {
              ...state.drafts,
              [userId]: userDrafts,
            },
          };
        });
      },

      // ✅ Clear all drafts for current user
      clearUserDrafts: () => {
        const { authUser } = useAuthStore.getState();
        if (!authUser?._id) return;

        const userId = authUser._id;

        set((state: DraftState) => {
          const drafts = { ...state.drafts };
          delete drafts[userId];
          return { drafts };
        });
      },

      // ✅ Clear everything
      clearAllDrafts: () => ({
        drafts: {},
      }),
    }),
    {
      name: "notehub-drafts",
    },
  ),
);
