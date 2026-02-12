import { create, type StateCreator } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { INote, ICollection, IUser } from "@/types/model";

type NoteStatusKey = "note" | "collection" | "noteContent" | "collaborator";

type NoteStatus = {
  state: string;
  error: string | null;
};

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  notesPerPage: number;
  hasMore: boolean;
}

export interface NoteStore {
  status: Record<NoteStatusKey, NoteStatus>;
  setStatus: (key: NoteStatusKey, value: NoteStatus) => void;

  selectedNote: string | null;
  noteNotFound: boolean;
  setNoteNotFound: (value: boolean) => void;

  collections: ICollection[];
  notesCache: Record<string, INote>;
  notes: INote[];

  pagination: PaginationState;

  getPublicNotes: (params: {
    page: number;
    limit: number;
    user?: boolean;
  }) => Promise<{
    notes: INote[];
    pagination: PaginationState;
  } | null>;

  getNoteContent: (noteId: string) => Promise<INote | null>;
  getNoteName: (noteId: string) => string | null;
  updateContent: (data: { noteId: string; content: string }) => Promise<void>;
  setselectedNote: (noteId: string | null) => void;

  insertNoteInCollection: (collectionId: string, note: INote) => void;
  deleteNoteFromCollection: (noteId: string) => void;
  replaceNoteFromCollection: (note: INote) => void;

  createCollection: (data: Partial<ICollection>) => Promise<ICollection | null>;
  deleteCollection: (collectionId: string) => Promise<void>;
  getAllCollections: (params: {
    userId: string;
    guest?: boolean;
  }) => Promise<ICollection[] | null>;
  renameCollection: (data: {
    _id: string;
    newName: string;
  }) => Promise<void>;
  updateCollectionVisibility: (data: {
    collectionId: string;
    visibility: "public" | "private";
  }) => Promise<void>;
  updateCollectionCollaborators: (data: {
    collectionId: string;
    collaborators: IUser[];
  }) => Promise<void>;

  createNote: (data: Partial<INote> & { collectionId: string }) => Promise<string | null>;
  deleteNote: (noteId: string) => Promise<void>;
  renameNote: (data: { noteId: string; newName: string }) => Promise<void>;
  moveTo: (data: { noteId: string; collectionId: string }) => Promise<void>;
  updateNoteCollaborators: (data: {
    noteId: string;
    collaborators: IUser[];
  }) => Promise<void>;
  updateNoteVisibility: (data: {
    noteId: string;
    visibility: "public" | "private";
  }) => Promise<"public" | "private" | undefined>;
}

type ApiErrorResponse = { message?: string };

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const err = error as AxiosError<ApiErrorResponse>;
  return err?.response?.data?.message || err?.message || fallback;
};

const createNoteStore: StateCreator<NoteStore> = (set, get) => {
  const setStatus: NoteStore["setStatus"] = (key, value) =>
    set((state: NoteStore) => ({
      status: { ...state.status, [key]: value },
    }));

  const updateCollectionInNotesArray = (
    collectionId: string,
    updatedCollection: Partial<ICollection>,
  ) => {
    set((state: NoteStore) => ({
      notes: state.notes.map((note) =>
        (note.collectionId as unknown as { _id?: string })?._id === collectionId
          ? ({
              ...note,
              collectionId: {
                ...(note.collectionId as unknown as ICollection),
                ...updatedCollection,
              },
            } as unknown as INote)
          : note,
      ) as INote[],
    }));
  };

  const updateNoteInNotesArray = (noteId: string, updates: Partial<INote>) => {
    set((state: NoteStore) => {
      const index = state.notes.findIndex((note) => String(note._id) === noteId);
      if (index === -1) return state;

      const newNotes = [...state.notes];
      newNotes[index] = {
        ...newNotes[index],
        ...updates,
      };
      return { notes: newNotes };
    });
  };

  return {
    status: {
      note: { state: "idle", error: null },
      collection: { state: "idle", error: null },
      noteContent: { state: "idle", error: null },
      collaborator: { state: "idle", error: null },
    },
    setStatus,

    selectedNote: null,
    noteNotFound: false,
    setNoteNotFound: (value: boolean) => set({ noteNotFound: value }),

    collections: [],
    notesCache: {},
    notes: [],

    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalNotes: 0,
      notesPerPage: 10,
      hasMore: false,
    },

    getPublicNotes: async ({
      page,
      limit,
      user,
    }: {
      page: number;
      limit: number;
      user?: boolean;
    }) => {
      setStatus("note", { state: "loading", error: null });
      try {
        const res = await axiosInstance.get("/note", {
          params: {
            page,
            limit,
            user: user ? "true" : undefined,
          },
        });

        const data = res.data as {
          data: { notes: INote[]; pagination: PaginationState };
        };
        const newNotes = data.data.notes;
        set({
          notes: page === 1 ? newNotes : [...get().notes, ...newNotes],
          pagination: data.data.pagination,
        });

        return {
          notes: newNotes,
          pagination: data.data.pagination,
        };
      } catch (error) {
        console.error("Error fetching public notes", error);
        setStatus("note", {
          state: "error",
          error: getApiErrorMessage(error, "Failed to load notes"),
        });
        return null;
      } finally {
        setStatus("note", { state: "idle", error: null });
      }
    },

    getNoteContent: async (noteId: string) => {
      const { notesCache } = get();

      if (noteId in notesCache) {
        return notesCache[noteId];
      }

      setStatus("noteContent", { state: "loading", error: null });

      try {
        const res = await axiosInstance.get(`note/${noteId}`);
        const note = res.data.note as INote;

        set({
          notesCache: {
            ...notesCache,
            [noteId]: note,
          },
          noteNotFound: false,
        });

        return note;
      } catch (error) {
        console.error("Error fetching note content", error);
        set({ noteNotFound: true });
        return null;
      } finally {
        setStatus("noteContent", { state: "idle", error: null });
      }
    },

    getNoteName: (noteId: string) => {
      const { collections } = get();
      for (const collection of collections) {
        const note = collection.notes?.find((n) => String(n._id) === noteId);
        if (note) {
          set({ noteNotFound: false });
          return note.name;
        }
      }
      set({ noteNotFound: true });
      return null;
    },

    updateContent: async (data: { noteId: string; content: string }) => {
      setStatus("noteContent", { state: "saving", error: null });
      try {
        const res = await axiosInstance.put("/note/", data);

        const { note, message } = res.data as {
          note: INote;
          message?: string;
        };
        set((state: NoteStore) => ({
          notesCache: {
            ...state.notesCache,
            [String(note._id)]: note,
          },
        }));

        get().replaceNoteFromCollection(note);
        updateNoteInNotesArray(String(note._id), {
          content: note.content,
          contentUpdatedAt: note.contentUpdatedAt,
        });

        toast.success(message || "Note updated");
      } catch (error) {
        console.error("Error updating content", error);
        toast.error(getApiErrorMessage(error, "Failed to update content"));
      } finally {
        setStatus("noteContent", { state: "idle", error: null });
      }
    },

    setselectedNote: (noteId: string | null) => {
      set({ selectedNote: noteId });
    },

    insertNoteInCollection: (collectionId: string, note: INote) => {
      set((state: NoteStore) => ({
        collections: state.collections.map((collection) =>
          String(collection._id) === collectionId
            ? { ...collection, notes: [...(collection.notes ?? []), note] }
            : collection,
        ),
      }));
    },

    deleteNoteFromCollection: (noteId: string) => {
      set((state: NoteStore) => ({
        collections: state.collections.map((collection) => ({
          ...collection,
          notes: collection.notes?.filter((note) => String(note._id) !== noteId),
        })),
      }));
    },

    replaceNoteFromCollection: (updatedNote: INote) => {
      set((state: NoteStore) => ({
        collections: state.collections.map((collection: ICollection) => ({
          ...collection,
          notes: collection.notes?.map((note) =>
            String(note._id) === String(updatedNote._id) ? updatedNote : note,
          ),
        })),
      }));
    },

    createCollection: async (data: Partial<ICollection>) => {
      setStatus("collection", { state: "creating", error: null });
      try {
        const res = await axiosInstance.post("/collection", data);
        const { collection, message } = res.data as {
          collection: ICollection;
          message?: string;
        };
        set((state: NoteStore) => ({
          collections: [...state.collections, collection],
        }));
        toast.success(message || "Collection created");
        return collection;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to create collection"));
        return null;
      } finally {
        setStatus("collection", { state: "idle", error: null });
      }
    },

    deleteCollection: async (collectionId: string) => {
      setStatus("collection", { state: "deleting", error: null });
      try {
        const res = await axiosInstance.delete(`/collection/${collectionId}`);
        set((state: NoteStore) => ({
          collections: state.collections.filter(
            (collection) => String(collection._id) !== collectionId,
          ),
        }));
        toast.success(res.data.message || "Collection deleted");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to delete collection"));
      } finally {
        setStatus("collection", { state: "idle", error: null });
      }
    },

    getAllCollections: async ({
      userId,
      guest = false,
    }: {
      userId: string;
      guest?: boolean;
    }) => {
      if (!guest) setStatus("collection", { state: "loading", error: null });

      try {
        const res = await axiosInstance.get("collection/all-collections", {
          params: { userId },
        });
        const { collections } = res.data as {
          collections: ICollection[];
        };
        if (!guest) {
          set({ collections });
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "collectionLength",
              JSON.stringify(collections.length),
            );
          }
        }
        return collections;
      } catch (error) {
        console.error(error);
        toast.error(
          getApiErrorMessage(error, "Failed to load collections"),
        );
        return null;
      } finally {
        setStatus("collection", { state: "idle", error: null });
      }
    },

    renameCollection: async (data: { _id: string; newName: string }) => {
      try {
        const res = await axiosInstance.put("collection/", data);
        const { collection, message } = res.data as {
          collection: ICollection;
          message?: string;
        };
        set((state: NoteStore) => ({
          collections: state.collections.map((c: ICollection) =>
            String(c._id) === String(collection._id)
              ? {
                  ...c,
                  name: collection.name,
                  updatedAt: collection.updatedAt,
                }
              : c,
          ),
        }));
        toast.success(message || "Collection renamed");
      } catch (error) {
        console.error(error);
        toast.error(getApiErrorMessage(error, "Failed to rename collection"));
      }
    },

    createNote: async (data: Partial<INote> & { collectionId: string }) => {
      setStatus("note", { state: "creating", error: null });
      const { collectionId } = data;
      try {
        const res = await axiosInstance.post("note/", data);
        const { note, message } = res.data as { note: INote; message?: string };

        get().insertNoteInCollection(String(collectionId), note);

        toast.success(message || "Note created");
        return String(note._id);
      } catch (error) {
        console.error(error);
        toast.error(getApiErrorMessage(error, "Failed to create note"));
        return null;
      } finally {
        setStatus("note", { state: "idle", error: null });
      }
    },

    deleteNote: async (noteId: string) => {
      try {
        const res = await axiosInstance.delete(`note/${noteId}`);

        get().deleteNoteFromCollection(noteId);
        set((state: NoteStore) => ({
          notes: state.notes.filter((note) => String(note._id) !== noteId),
        }));

        toast.success(res.data.message || "Note deleted");
      } catch (error) {
        console.error(error);
        toast.error(getApiErrorMessage(error, "Failed to delete note"));
      }
    },

    renameNote: async (data: { noteId: string; newName: string }) => {
      try {
        const res = await axiosInstance.put("note/rename", data);
        const { note, message } = res.data as { note: INote; message?: string };

        get().replaceNoteFromCollection(note);
        updateNoteInNotesArray(String(note._id), {
          slug: note.slug,
          name: note.name,
          updatedAt: note.updatedAt,
        });

        toast.success(message || "Note renamed");
      } catch (error) {
        console.error(error);
        toast.error(getApiErrorMessage(error, "Failed to rename note"));
      }
    },

    moveTo: async (data: { noteId: string; collectionId: string }) => {
      try {
        setStatus("note", { state: "moving", error: null });
        const res = await axiosInstance.post("/note/move-to", data);
        const { collection, note, message } = res.data as {
          collection: ICollection;
          note: INote;
          message?: string;
        };
        get().deleteNoteFromCollection(String(note._id));
        get().insertNoteInCollection(String(collection._id), note);

        updateNoteInNotesArray(String(note._id), {
          collectionId: collection as unknown as INote["collectionId"],
          updatedAt: note.updatedAt,
        });

        toast.success(message || "Note moved");
      } catch (error) {
        console.error(error);
        toast.error(getApiErrorMessage(error, "Failed to move note"));
      } finally {
        setStatus("note", { state: "idle", error: null });
      }
    },

    updateCollectionVisibility: async ({
      visibility,
      collectionId,
    }: {
      visibility: "public" | "private";
      collectionId: string;
    }) => {
      try {
        const res = await axiosInstance.put("collection/update-visibility", {
          visibility,
          collectionId,
        });
        const { collection, message } = res.data as {
          collection: ICollection;
          message?: string;
        };
        updateCollectionInNotesArray(String(collection._id), {
          visibility: collection.visibility,
        });
        set((state: NoteStore) => ({
          collections: state.collections.map((c: ICollection) =>
            String(c._id) === String(collection._id)
              ? {
                  ...c,
                  visibility: collection.visibility,
                  updatedAt: collection.updatedAt,
                }
              : c,
          ),
        }));
        toast.success(message || "Visibility updated");
      } catch (error) {
        console.error(error);
        toast.error(
          getApiErrorMessage(error, "Failed to update visibility"),
        );
      }
    },

    updateCollectionCollaborators: async ({
      collectionId,
      collaborators,
    }: {
      collectionId: string;
      collaborators: IUser[];
    }) => {
      setStatus("collaborator", { state: "saving", error: null });
      try {
        const res = await axiosInstance.put("collection/update-collaborators", {
          collectionId,
          collaborators,
        });
        const { collection, message } = res.data as {
          collection: ICollection & { collaborators: IUser[] };
          message?: string;
        };

        set((state: NoteStore) => ({
          collections: state.collections.map((c: ICollection) =>
            String(c._id) === String(collection._id)
              ? {
                  ...c,
                  collaborators: collection.collaborators,
                  updatedAt: collection.updatedAt,
                }
              : c,
          ),
        }));

        toast.success(message || "Collaborators updated");
      } catch (error) {
        console.error(error);
        toast.error(
          getApiErrorMessage(error, "Failed to update collaborators"),
        );
      } finally {
        setStatus("collaborator", { state: "idle", error: null });
      }
    },

    updateNoteCollaborators: async ({
      noteId,
      collaborators,
    }: {
      noteId: string;
      collaborators: IUser[];
    }) => {
      setStatus("collaborator", { state: "saving", error: null });
      try {
        const res = await axiosInstance.put("note/update-collaborators", {
          noteId,
          collaborators,
        });
        const { note: updatedNote, message } = res.data as {
          note: INote;
          message?: string;
        };
        get().replaceNoteFromCollection(updatedNote);

        toast.success(message || "Note collaborators updated");
      } catch (error) {
        console.error(error);
        toast.error(
          getApiErrorMessage(error, "Failed to update note collaborators"),
        );
      } finally {
        setStatus("collaborator", { state: "idle", error: null });
      }
    },

    updateNoteVisibility: async ({
      noteId,
      visibility,
    }: {
      noteId: string;
      visibility: "public" | "private";
    }) => {
      try {
        const res = await axiosInstance.put("note/update-visibility", {
          noteId,
          visibility,
        });
        const { note: updatedNote, message } = res.data as {
          note: INote;
          message?: string;
        };

        set((state: NoteStore) => ({
          collections: state.collections.map((collection: ICollection) => ({
            ...collection,
            notes: collection.notes?.map((note) =>
              String(note._id) === String(updatedNote._id)
                ? { ...note, visibility: updatedNote.visibility }
                : note,
            ),
          })),
        }));

        updateNoteInNotesArray(String(updatedNote._id), {
          visibility: updatedNote.visibility,
          updatedAt: updatedNote.updatedAt,
        });

        toast.success(message || "Note visibility updated");

        return updatedNote.visibility;
      } catch (error) {
        console.error(error);
        toast.error(
          getApiErrorMessage(error, "Failed to update note visibility"),
        );
        return undefined;
      }
    },
  };
};

export const useNoteStore = create<NoteStore>(createNoteStore);
