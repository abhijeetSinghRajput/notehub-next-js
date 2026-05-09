// components/search/SearchButton.tsx
"use client";

import * as React from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useLocalStorage, type SearchHistoryUser } from "@/app/stores/useLocalStorage";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import { axiosInstance } from "@/lib/axios";
import type { IUser, PopulatedNote } from "@/types/model";

import { NotesTab } from "./NotesTab";
import { UsersTab } from "./UsersTab";
import { getFirstMatchSnippets } from "./utils";
import {
  DEFAULT_PAGINATION,
  type SearchResults,
  type NotesSearchResponse,
  type UsersSearchResponse,
} from "./types";

export function SearchButton() {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"notes" | "users">("notes");
  const [searchResults, setSearchResults] = React.useState<SearchResults>({
    notes: [],
    users: [],
  });
  const [pagination, setPagination] = React.useState({
    notes: DEFAULT_PAGINATION,
    users: DEFAULT_PAGINATION,
  });
  const [isSearching, setIsSearching] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const notesAbortRef = React.useRef<AbortController | null>(null);
  const usersAbortRef = React.useRef<AbortController | null>(null);

  const { getAllUsers } = useAuthStore();
  const {
    searchHistory,
    addSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
  } = useLocalStorage();

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchNotes = React.useCallback(async (query: string, page = 1) => {
    notesAbortRef.current?.abort();
    notesAbortRef.current = new AbortController();

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults((s) => ({ ...s, notes: [] }));
      setPagination((s) => ({ ...s, notes: DEFAULT_PAGINATION }));
      return;
    }

    try {
      setIsSearching(true);
      const res = await axiosInstance.get<NotesSearchResponse>(
        `/note/search?q=${encodeURIComponent(trimmed)}&page=${page}&limit=10`,
        { signal: notesAbortRef.current.signal },
      );
      setSearchResults((s) => ({ ...s, notes: res.data.notes || [] }));
      setPagination((s) => ({ ...s, notes: res.data.pagination }));
    } catch (err) {
      if ((err as { code?: string })?.code === "ERR_CANCELED") return;
      setSearchResults((s) => ({ ...s, notes: [] }));
    } finally {
      setIsSearching(false);
      setIsTyping(false);
    }
  }, []);

  const fetchUsers = React.useCallback(
    async (query: string, page = 1) => {
      usersAbortRef.current?.abort();
      usersAbortRef.current = new AbortController();

      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults((s) => ({ ...s, users: [] }));
        setPagination((s) => ({ ...s, users: DEFAULT_PAGINATION }));
        return;
      }

      try {
        setIsSearching(true);
        const res = (await getAllUsers({
          page,
          limit: 10,
          filter: "all",
          search: trimmed,
        })) as UsersSearchResponse;
        setSearchResults((s) => ({ ...s, users: res.users || [] }));
        setPagination((s) => ({ ...s, users: res.pagination }));
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        setSearchResults((s) => ({ ...s, users: [] }));
      } finally {
        setIsSearching(false);
        setIsTyping(false);
      }
    },
    [getAllUsers],
  );

  const debouncedFetchNotes = useDebounceCallback(fetchNotes, 300);
  const debouncedFetchUsers = useDebounceCallback(fetchUsers, 300);

  // ── Effects ─────────────────────────────────────────────────────────────────

  // Fire fetch on query change for active tab
  React.useEffect(() => {
    setIsTyping(true);
    if (activeTab === "notes") debouncedFetchNotes(searchQuery, 1);
    else debouncedFetchUsers(searchQuery, 1);

    return () => {
      debouncedFetchNotes.cancel();
      debouncedFetchUsers.cancel();
    };
  }, [searchQuery, activeTab, debouncedFetchNotes, debouncedFetchUsers]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      notesAbortRef.current?.abort();
      usersAbortRef.current?.abort();
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTabChange = React.useCallback(
    (tab: string) => {
      const t = tab as "notes" | "users";
      setActiveTab(t);
      const hasResults =
        t === "notes"
          ? searchResults.notes.length > 0
          : searchResults.users.length > 0;

      if (searchQuery.trim() && !hasResults) {
        if (t === "notes") debouncedFetchNotes(searchQuery, 1);
        else debouncedFetchUsers(searchQuery, 1);
      }
    },
    [searchQuery, searchResults, debouncedFetchNotes, debouncedFetchUsers],
  );

  const handleClose = React.useCallback(() => setOpen(false), []);

  // ── Memoized notes with snippets ────────────────────────────────────────────

  const memoizedNotes = React.useMemo(
    () =>
      searchResults.notes.map((note) => ({
        ...(note as PopulatedNote),
        snippets: getFirstMatchSnippets(note.content, searchQuery) ?? [],
      })),
    [searchResults.notes, searchQuery],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Button
        tooltip="Ctrl + K"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-md"
        onClick={() => setOpen(true)}
        aria-label="Search Notes and Users"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeButtonClassName="hidden"
          className="max-w-3xl rounded-tl-none! rounded-tr-none! gap-0 top-0 -translate-x-1/2 translate-y-0 bg-muted p-0 overflow-hidden"
        >
          {/* ── Search input ── */}
          <DialogHeader>
            <div className="relative flex items-center border-b">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="h-full rounded-none"
                  aria-label="Go Back"
                >
                  <ArrowLeft className="size-6!" />
                </Button>
              </DialogClose>

              <Input
                ref={inputRef}
                placeholder="Search notes and users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsTyping(true);
                }}
                autoFocus
                className="bg-transparent! py-3 pr-14 border-0 h-auto shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              <Button
                disabled={searchQuery.trim() === ""}
                variant="ghost"
                className="h-full rounded-none absolute right-0 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
              >
                <X />
              </Button>

              {/* Loading bar */}
              {isSearching && (
                <div className="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
                  <div className="absolute left-0 w-1/2 h-full bg-primary/30 animate-slide" />
                  <style jsx>{`
                    @keyframes slide {
                      0% {
                        left: -50%;
                      }
                      100% {
                        left: 100%;
                      }
                    }
                    .animate-slide {
                      animation: slide 1.5s infinite linear;
                    }
                  `}</style>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* ── Tabs ── */}
          <Tabs
            defaultValue="notes"
            className="gap-0"
            onValueChange={handleTabChange}
          >
            <TabsList className="h-auto! grid grid-cols-2 w-full">
              <TabsTrigger
                value="notes"
                className="w-full h-12 gap-3 rounded-none text-base border-none border-b-[3px] border-transparent shadow-none! data-[state=active]:bg-primary/5 data-[state=active]:border-primary/50"
              >
                Notes
                {pagination.notes.totalItems > 0 && (
                  <Badge className="px-1.5">
                    {pagination.notes.totalItems}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="w-full h-12 gap-3 rounded-none text-base border-none border-b-[3px] border-transparent shadow-none! data-[state=active]:bg-primary/5 data-[state=active]:border-primary/50"
              >
                Users
                {pagination.users.totalItems > 0 && (
                  <Badge className="px-1.5">
                    {pagination.users.totalItems}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent className="mt-0" value="notes">
              <div className="max-h-[70vh] overflow-y-auto">
                <NotesTab
                  notes={memoizedNotes}
                  pagination={pagination.notes}
                  searchQuery={searchQuery}
                  isSearching={isSearching}
                  isTyping={isTyping}
                  onPageChange={(page) => fetchNotes(searchQuery, page)}
                  onClose={handleClose}
                />
              </div>
            </TabsContent>

            <TabsContent className="mt-0" value="users">
              <div className="max-h-[80vh] overflow-y-auto">
                <UsersTab
                  users={searchResults.users as IUser[]}
                  pagination={pagination.users}
                  searchQuery={searchQuery}
                  isSearching={isSearching}
                  isTyping={isTyping}
                  searchHistory={searchHistory as unknown as IUser[]}
                  onPageChange={(page) => fetchUsers(searchQuery, page)}
                  onClose={handleClose}
                  onAddHistory={(user) => addSearchHistory(user as unknown as SearchHistoryUser)}
                  onRemoveHistory={removeSearchHistory}
                  onClearHistory={clearSearchHistory}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
