import { create, type StateCreator } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { INote, ICollection, IUser } from "@/types/model";

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteStatusKey = "note" | "collection" | "noteContent" | "collaborator";
type StatusState = "idle" | "loading" | "saving" | "creating" | "deleting" | "moving" | "error";

type NoteStatus = {
  state: StatusState;
  error: string | null;
};

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  notesPerPage: number;
  hasMore: boolean;
}

// Unified cache entry — TTL-aware
interface CacheEntry<T> {
  data: T;
  fetchedAt: number; // Date.now()
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const isFresh = <T>(entry: CacheEntry<T> | undefined): boolean =>
  !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;

// ─── Store interface ──────────────────────────────────────────────────────────

export interface NoteStore {
  // Status
  status: Record<NoteStatusKey, NoteStatus>;
  setStatus: (key: NoteStatusKey, value: Partial<NoteStatus>) => void;

  // Selection
  selectedNote: string | null;
  noteNotFound: boolean;
  setNoteNotFound: (value: boolean) => void;
  setSelectedNote: (noteId: string | null) => void;

  // Collections
  collections: ICollection[];

  // Notes (public feed)
  notes: INote[];
  pagination: PaginationState;
  setNotes: (notes: INote[]) => void;
  setPagination: (pagination: PaginationState) => void;

  // Unified caches
  noteCache: Record<string, CacheEntry<INote>>;       // noteId → full note
  collectionCache: Record<string, CacheEntry<ICollection[]>>; // userId → collections

  // ── Reads ──
  getPublicNotes: (params: { page: number; limit: number; user?: boolean }) => Promise<{ notes: INote[]; pagination: PaginationState } | null>;
  getNoteContent: (noteId: string, force?: boolean) => Promise<INote | null>;
  getNoteName: (noteId: string) => string | null;
  getAllCollections: (params: { userId: string; guest?: boolean; force?: boolean }) => Promise<ICollection[] | null>;

  // ── Writes (all optimistic) ──
  updateContent: (data: { noteId: string; content: string }) => Promise<INote | null>;
  createCollection: (data: Partial<ICollection>) => Promise<ICollection | null>;
  deleteCollection: (collectionId: string) => Promise<void>;
  renameCollection: (data: { _id: string; newName: string }) => Promise<void>;
  updateCollectionVisibility: (data: { collectionId: string; visibility: "public" | "private" }) => Promise<void>;
  updateCollectionCollaborators: (data: { collectionId: string; collaborators: IUser[] }) => Promise<void>;
  createNote: (data: Partial<INote> & { collectionId: string }) => Promise<string | null>;
  deleteNote: (noteId: string) => Promise<void>;
  renameNote: (data: { noteId: string; newName: string }) => Promise<void>;
  moveTo: (data: { noteId: string; collectionId: string }) => Promise<void>;
  updateNoteCollaborators: (data: { noteId: string; collaborators: IUser[] }) => Promise<void>;
  updateNoteVisibility: (data: { noteId: string; visibility: "public" | "private" }) => Promise<"public" | "private" | undefined>;
  updateNote: (noteId: string, data: Partial<INote>) => Promise<INote | null>;

  // ── Cache helpers ──
  invalidateNoteCache: (noteId: string) => void;
  invalidateCollectionCache: (userId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ApiErrorResponse = { message?: string };

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as AxiosError<ApiErrorResponse>;
  return err?.response?.data?.message || err?.message || fallback;
};

/** Apply a patch to every note in every collection (and the flat notes array) matching noteId */
const patchNote = (
  state: Pick<NoteStore, "collections" | "notes" | "noteCache">,
  noteId: string,
  patch: Partial<INote>,
): Partial<NoteStore> => {
  const patchedCollections = state.collections.map((col) => ({
    ...col,
    notes: col.notes?.map((n) =>
      String(n._id) === noteId ? { ...n, ...patch } : n,
    ),
  }));

  const patchedNotes = state.notes.map((n) =>
    String(n._id) === noteId ? { ...n, ...patch } : n,
  );

  // Also patch the noteCache if present
  const existing = state.noteCache[noteId];
  const patchedNoteCache = existing
    ? { ...state.noteCache, [noteId]: { data: { ...existing.data, ...patch }, fetchedAt: existing.fetchedAt } }
    : state.noteCache;

  return { collections: patchedCollections, notes: patchedNotes, noteCache: patchedNoteCache };
};

/** Apply a patch to a collection in the collections array */
const patchCollection = (
  collections: ICollection[],
  collectionId: string,
  patch: Partial<ICollection>,
): ICollection[] =>
  collections.map((c) =>
    String(c._id) === collectionId ? { ...c, ...patch } : c,
  );

// ─── Store ────────────────────────────────────────────────────────────────────

const createNoteStore: StateCreator<NoteStore> = (set, get) => {
  // ── Status helper ──────────────────────────────────────────────────────────
  const setStatus: NoteStore["setStatus"] = (key, value) =>
    set((s) => ({
      status: {
        ...s.status,
        [key]: { ...s.status[key], ...value },
      },
    }));

  // ── withStatus: wraps an async op with status bookkeeping ─────────────────
  const withStatus = async <T>(
    key: NoteStatusKey,
    loadingState: StatusState,
    fn: () => Promise<T>,
  ): Promise<T> => {
    setStatus(key, { state: loadingState, error: null });
    try {
      return await fn();
    } catch (error) {
      setStatus(key, { state: "error", error: getApiErrorMessage(error, "Something went wrong") });
      throw error;
    } finally {
      setStatus(key, { state: "idle", error: null });
    }
  };

  return {
    // ── Initial state ────────────────────────────────────────────────────────
    status: {
      note:        { state: "idle", error: null },
      collection:  { state: "idle", error: null },
      noteContent: { state: "idle", error: null },
      collaborator:{ state: "idle", error: null },
    },
    setStatus,

    selectedNote: null,
    noteNotFound: false,
    setNoteNotFound: (value) => set({ noteNotFound: value }),
    setSelectedNote: (noteId) => set({ selectedNote: noteId }),

    collections: [],
    notes: [],
    pagination: { currentPage: 1, totalPages: 0, totalNotes: 0, notesPerPage: 10, hasMore: false },
    setNotes: (notes) => set({ notes }),
    setPagination: (pagination) => set({ pagination }),

    noteCache: {},
    collectionCache: {},

    invalidateNoteCache: (noteId) =>
      set((s) => {
        const { [noteId]: _, ...rest } = s.noteCache;
        return { noteCache: rest };
      }),

    invalidateCollectionCache: (userId) =>
      set((s) => {
        const { [userId]: _, ...rest } = s.collectionCache;
        return { collectionCache: rest };
      }),

    // ── Reads ────────────────────────────────────────────────────────────────

    getPublicNotes: async ({ page, limit, user }) => {
      return withStatus("note", "loading", async () => {
        const res = await axiosInstance.get("/note", {
          params: { page, limit, user: user ? "true" : undefined },
        });
        const { notes: newNotes, pagination } = (res.data as any).data as {
          notes: INote[];
          pagination: PaginationState;
        };
        set((s) => ({
          notes: page === 1 ? newNotes : [...s.notes, ...newNotes],
          pagination,
        }));
        return { notes: newNotes, pagination };
      }).catch(() => null);
    },

    getNoteContent: async (noteId, force = false) => {
      const { noteCache } = get();
      const cached = noteCache[noteId];

      // Return from cache if fresh and not forced
      if (!force && isFresh(cached)) return cached.data;

      return withStatus("noteContent", "loading", async () => {
        const res = await axiosInstance.get(`note/${noteId}`);
        const note = res.data.note as INote;
        set((s) => ({
          noteCache: { ...s.noteCache, [noteId]: { data: note, fetchedAt: Date.now() } },
          noteNotFound: false,
        }));
        return note;
      }).catch(() => {
        set({ noteNotFound: true });
        return null;
      });
    },

    getNoteName: (noteId) => {
      for (const col of get().collections) {
        const note = col.notes?.find((n) => String(n._id) === noteId);
        if (note) {
          set({ noteNotFound: false });
          return note.name;
        }
      }
      set({ noteNotFound: true });
      return null;
    },

    getAllCollections: async ({ userId, guest = false, force = false }) => {
      const { collectionCache } = get();
      const cached = collectionCache[userId];

      // Return from cache if fresh and not forced (only for non-guest)
      if (!force && !guest && isFresh(cached)) {
        set({ collections: cached.data });
        return cached.data;
      }

      if (!guest) setStatus("collection", { state: "loading", error: null });

      try {
        const res = await axiosInstance.get("collection/all-collections", { params: { userId } });
        const { collections } = res.data as { collections: ICollection[] };

        if (!guest) {
          set((s) => ({
            collections,
            collectionCache: {
              ...s.collectionCache,
              [userId]: { data: collections, fetchedAt: Date.now() },
            },
          }));
          if (typeof window !== "undefined") {
            localStorage.setItem("collectionLength", JSON.stringify(collections.length));
          }
        }
        return collections;
      } catch (error) {
        console.error(error);
        toast.error(getApiErrorMessage(error, "Failed to load collections"));
        return null;
      } finally {
        if (!guest) setStatus("collection", { state: "idle", error: null });
      }
    },

    // ── Writes (Optimistic) ──────────────────────────────────────────────────

    updateContent: async ({ noteId, content }) => {
      // Optimistic
      const prev = get().noteCache[noteId]?.data;
      set((s) => ({ ...patchNote(s, noteId, { content }) }));

      return await withStatus("noteContent", "saving", async () => {
        const res = await axiosInstance.put("/note/", { noteId, content });
        const { note } = res.data as { note: INote; message?: string };
        // Sync with server truth
        set((s) => ({
          ...patchNote(s, noteId, { content: note.content, contentUpdatedAt: note.contentUpdatedAt }),
          noteCache: { ...s.noteCache, [noteId]: { data: note, fetchedAt: Date.now() } },
        }));
        toast.success(res.data.message || "Note updated");
        return note;
      }).catch(() => {
        // Rollback
        if (prev) set((s) => ({ ...patchNote(s, noteId, { content: prev.content }) }));
        toast.error("Failed to update content");
        return null;
      });
    },

    createCollection: async (data) => {
      return withStatus("collection", "creating", async () => {
        const res = await axiosInstance.post("/collection", data);
        const { collection, message } = res.data as { collection: ICollection; message?: string };
        set((s) => ({ collections: [...s.collections, collection] }));
        toast.success(message || "Collection created");
        return collection;
      }).catch(() => {
        toast.error("Failed to create collection");
        return null;
      });
    },

    deleteCollection: async (collectionId) => {
      // Optimistic
      const prevCollections = get().collections;
      set((s) => ({ collections: s.collections.filter((c) => String(c._id) !== collectionId) }));

      await withStatus("collection", "deleting", async () => {
        const res = await axiosInstance.delete(`/collection/${collectionId}`);
        toast.success(res.data.message || "Collection deleted");
      }).catch(() => {
        set({ collections: prevCollections }); // Rollback
        toast.error("Failed to delete collection");
      });
    },

    renameCollection: async ({ _id, newName }) => {
      // Optimistic
      const prevCollections = get().collections;
      set((s) => ({ collections: patchCollection(s.collections, _id, { name: newName }) }));

      await axiosInstance.put("collection/", { _id, newName })
        .then((res) => {
          const { collection } = res.data as { collection: ICollection };
          // Sync exact server values (slug etc.)
          set((s) => ({ collections: patchCollection(s.collections, _id, { name: collection.name, updatedAt: collection.updatedAt }) }));
          toast.success(res.data.message || "Collection renamed");
        })
        .catch(() => {
          set({ collections: prevCollections }); // Rollback
          toast.error("Failed to rename collection");
        });
    },

    updateCollectionVisibility: async ({ collectionId, visibility }) => {
      // Optimistic
      const prevCollections = get().collections;
      set((s) => ({
        collections: patchCollection(s.collections, collectionId, { visibility }),
        notes: s.notes.map((n) =>
          (n.collectionId as unknown as { _id?: string })?._id === collectionId
            ? { ...n, collectionId: { ...(n.collectionId as any), visibility } }
            : n,
        ),
      }));

      await axiosInstance.put("collection/update-visibility", { visibility, collectionId })
        .then((res) => {
          const { collection } = res.data as { collection: ICollection };
          set((s) => ({ collections: patchCollection(s.collections, collectionId, { visibility: collection.visibility, updatedAt: collection.updatedAt }) }));
          toast.success(res.data.message || "Visibility updated");
        })
        .catch(() => {
          set({ collections: prevCollections }); // Rollback
          toast.error("Failed to update visibility");
        });
    },

    updateCollectionCollaborators: async ({ collectionId, collaborators }) => {
      await withStatus("collaborator", "saving", async () => {
        const res = await axiosInstance.put("collection/update-collaborators", { collectionId, collaborators });
        const { collection } = res.data as { collection: ICollection & { collaborators: IUser[] }; message?: string };
        set((s) => ({ collections: patchCollection(s.collections, collectionId, { collaborators: collection.collaborators, updatedAt: collection.updatedAt }) }));
        toast.success(res.data.message || "Collaborators updated");
      }).catch(() => toast.error("Failed to update collaborators"));
    },

    createNote: async (data) => {
      return withStatus("note", "creating", async () => {
        const res = await axiosInstance.post("note/", data);
        const { note, message } = res.data as { note: INote; message?: string };
        set((s) => ({
          collections: s.collections.map((col) =>
            String(col._id) === data.collectionId
              ? { ...col, notes: [...(col.notes ?? []), note] }
              : col,
          ),
        }));
        toast.success(message || "Note created");
        return String(note._id);
      }).catch(() => {
        toast.error("Failed to create note");
        return null;
      });
    },

    deleteNote: async (noteId) => {
      // Optimistic
      const prevState = { collections: get().collections, notes: get().notes };
      set((s) => ({
        collections: s.collections.map((col) => ({
          ...col,
          notes: col.notes?.filter((n) => String(n._id) !== noteId),
        })),
        notes: s.notes.filter((n) => String(n._id) !== noteId),
      }));

      await axiosInstance.delete(`note/${noteId}`)
        .then((res) => toast.success(res.data.message || "Note deleted"))
        .catch(() => {
          set(prevState); // Rollback
          toast.error("Failed to delete note");
        });
    },

    renameNote: async ({ noteId, newName }) => {
      // Optimistic
      const prevState = { collections: get().collections, notes: get().notes };
      set((s) => ({ ...patchNote(s, noteId, { name: newName }) }));

      await axiosInstance.put("note/rename", { noteId, newName })
        .then((res) => {
          const { note } = res.data as { note: INote };
          // Sync server values (slug may change on rename)
          set((s) => ({ ...patchNote(s, noteId, { name: note.name, slug: note.slug, updatedAt: note.updatedAt }) }));
          toast.success(res.data.message || "Note renamed");
        })
        .catch(() => {
          set(prevState); // Rollback
          toast.error("Failed to rename note");
        });
    },

    moveTo: async ({ noteId, collectionId }) => {
      // Optimistic: remove from old collection (we'll add after server confirms with correct data)
      const prevCollections = get().collections;
      set((s) => ({
        collections: s.collections.map((col) => ({
          ...col,
          notes: col.notes?.filter((n) => String(n._id) !== noteId),
        })),
      }));

      await withStatus("note", "moving", async () => {
        const res = await axiosInstance.post("/note/move-to", { noteId, collectionId });
        const { collection, note } = res.data as { collection: ICollection; note: INote };
        set((s) => ({
          collections: s.collections.map((col) =>
            String(col._id) === String(collection._id)
              ? { ...col, notes: [...(col.notes ?? []), note] }
              : col,
          ),
          ...patchNote(s, noteId, {
            collectionId: collection as unknown as INote["collectionId"],
            updatedAt: note.updatedAt,
          }),
        }));
        toast.success(res.data.message || "Note moved");
      }).catch(() => {
        set({ collections: prevCollections }); // Rollback
        toast.error("Failed to move note");
      });
    },

    updateNoteCollaborators: async ({ noteId, collaborators }) => {
      await withStatus("collaborator", "saving", async () => {
        const res = await axiosInstance.put("note/update-collaborators", { noteId, collaborators });
        const { note } = res.data as { note: INote };
        set((s) => ({ ...patchNote(s, noteId, { collaborators: note.collaborators as any }) }));
        toast.success(res.data.message || "Note collaborators updated");
      }).catch(() => toast.error("Failed to update note collaborators"));
    },

    updateNoteVisibility: async ({ noteId, visibility }) => {
      // Optimistic
      const prevState = { collections: get().collections, notes: get().notes };
      set((s) => ({ ...patchNote(s, noteId, { visibility }) }));

      return axiosInstance.put("note/update-visibility", { noteId, visibility })
        .then((res) => {
          const { note } = res.data as { note: INote };
          set((s) => ({ ...patchNote(s, noteId, { visibility: note.visibility, updatedAt: note.updatedAt }) }));
          toast.success(res.data.message || "Note visibility updated");
          return note.visibility;
        })
        .catch(() => {
          set(prevState); // Rollback
          toast.error("Failed to update note visibility");
          return undefined;
        });
    },
    updateNote: async (noteId, data) => {
      // Optimistic
      const prevState = { collections: get().collections, notes: get().notes, noteCache: get().noteCache };
      set((s) => ({ ...patchNote(s, noteId, data) }));

      return await withStatus("note", "saving", async () => {
        const res = await axiosInstance.patch(`note/${noteId}`, data);
        const { note } = res.data as { note: INote };
        set((s) => ({
          ...patchNote(s, noteId, note),
          noteCache: { ...s.noteCache, [noteId]: { data: note, fetchedAt: Date.now() } },
        }));
        toast.success(res.data.message || "Note updated");
        return note;
      }).catch(() => {
        set(prevState); // Rollback
        toast.error("Failed to update note");
        return null;
      });
    },
  };
};

export const useNoteStore = create<NoteStore>(createNoteStore);