// components/search/types.ts
import type { INote, IUser, PopulatedNote } from "@/types/model";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SearchResults {
  notes: INote[];
  users: IUser[];
}

export interface NotesSearchResponse {
  notes: PopulatedNote[];
  pagination: PaginationState;
}

export interface UsersSearchResponse {
  users: IUser[];
  pagination: PaginationState;
}

export const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};