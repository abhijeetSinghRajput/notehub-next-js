"use client";

import * as React from "react";
import {
  Search,
  User,
  Clock,
  X,
  Trash2,
  Ghost,
  ArrowLeft,
  Folder,
  Command,
} from "lucide-react";
import { EmptyState } from "@/components/collection/EmptyState";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import NProgress from "nprogress";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { axiosInstance } from "@/lib/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { stripLatex } from "@/lib/utils";
import { removeStopwords } from "stopword";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import BadgeIcon from "./icons/BadgeIcon";
import { useDebounceCallback } from "../hooks/useDebounceCallback";
import { useRouter } from "nextjs-toploader/app";
import { INote, IUser, PopulatedNote } from "@/types/model";
import Image from "next/image";

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchResults {
  notes: INote[];
  users: IUser[];
}

interface NotesSearchResponse {
  notes: PopulatedNote[];
  pagination: PaginationState;
}

interface UsersSearchResponse {
  users: IUser[];
  pagination: PaginationState;
}

const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function getFirstMatchSnippets(
  html: string,
  query: string,
  radius = 60,
  limit = 3,
) {
  if (!html || !query) return [];

  const normalizedHtml = html
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|td|th|blockquote)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ");

  const div = document.createElement("div");
  div.innerHTML = normalizedHtml;
  const text = stripLatex(div.textContent || "");
  const lowerText = text.toLowerCase();
  const keywords = removeStopwords(query.toLowerCase().split(/\s+/));
  const snippets = [];

  for (const word of keywords) {
    if (snippets.length >= limit) break;
    const index = lowerText.indexOf(word);
    if (index === -1) continue;
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + word.length + radius);
    snippets.push(
      <span key={word}>
        {start > 0 && "..."}
        {text.slice(start, index)}
        <mark className="bg-yellow-200 text-black">
          {text.slice(index, index + word.length)}
        </mark>
        {text.slice(index + word.length, end)}
        {end < text.length && "..."}
      </span>,
    );
  }

  return snippets;
}

export function SearchButton() {
  const router = useRouter();
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

  const { getAllUsers } = useAuthStore();
  const {
    searchHistory,
    addSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
  } = useLocalStorage();

  const inputRef = React.useRef<HTMLInputElement>(null);

  // One AbortController ref per tab
  const notesAbortRef = React.useRef<AbortController | null>(null);
  const usersAbortRef = React.useRef<AbortController | null>(null);

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
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Notes search failed:", err);
      setSearchResults((s) => ({ ...s, notes: [] }));
    } finally {
      setIsSearching(false);
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
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED") return;
        console.error("Users search failed:", err);
        setSearchResults((s) => ({ ...s, users: [] }));
      } finally {
        setIsSearching(false);
      }
    },
    [getAllUsers],
  );

  // Debounced versions
  const debouncedFetchNotes = useDebounceCallback(fetchNotes, 300);
  const debouncedFetchUsers = useDebounceCallback(fetchUsers, 300);

  // Fire only the active tab's fetch on query change
  React.useEffect(() => {
    setIsTyping(true);
    if (activeTab === "notes") {
      debouncedFetchNotes(searchQuery, 1);
    } else {
      debouncedFetchUsers(searchQuery, 1);
    }
    return () => {
      debouncedFetchNotes.cancel();
      debouncedFetchUsers.cancel();
    };
  }, [searchQuery, activeTab]);

  // When tab switches, fetch if we don't have results yet for that tab
  const handleTabChange = React.useCallback(
    (tab: string) => {
      const t = tab as "notes" | "users";
      setActiveTab(t);
      const hasResults =
        t === "notes"
          ? searchResults.notes.length > 0
          : searchResults.users.length > 0;

      // Only fetch if query exists and we don't have results for this tab yet
      if (searchQuery.trim() && !hasResults) {
        if (t === "notes") debouncedFetchNotes(searchQuery, 1);
        else debouncedFetchUsers(searchQuery, 1);
      }
    },
    [searchQuery, searchResults, debouncedFetchNotes, debouncedFetchUsers],
  );

  const handleNotesPageChange = (page: number) => fetchNotes(searchQuery, page);
  const handleUsersPageChange = (page: number) => fetchUsers(searchQuery, page);

  // Cleanup abort controllers on unmount
  React.useEffect(() => {
    return () => {
      notesAbortRef.current?.abort();
      usersAbortRef.current?.abort();
    };
  }, []);

  // Keyboard shortcut
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

  const generateSnippet = React.useCallback(
    (html: string) => getFirstMatchSnippets(html, searchQuery),
    [searchQuery],
  );

  const memoizedNotes = React.useMemo(
    () =>
      searchResults.notes.map((note) => ({
        ...note,
        snippets: generateSnippet(note.content),
      })),
    [searchResults.notes, generateSnippet],
  );

  return (
    <>
      <Button
        variant="ghost"
        className="h-9 w-9 sm:w-auto rounded-md"
        onClick={() => setOpen(true)}
        aria-label="Search Notes and Users"
      >
        <Search className="h-4 w-4" />
        <kbd className="hidden sm:flex items-center text-muted-foreground text-xs gap-1">
          <Command className="size-3!" />K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeButtonClassName="hidden"
          className="max-w-3xl rounded-tl-none! rounded-tr-none! gap-0 top-0 -translate-x-1/2 translate-y-0 bg-muted p-0 overflow-hidden"
        >
          <DialogHeader>
            <div className="relative flex items-center border-b">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="h-full rounded-none"
                  aria-label="Go back"
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
                {searchResults.notes.length === 0 ? (
                  searchQuery && !isTyping ? (
                    isSearching ? (
                      <Searching searchQuery={searchQuery} type="notes" />
                    ) : (
                      <NotFound searchQuery={searchQuery} type="notes" />
                    )
                  ) : (
                    <EmptyState
                      icon={<Search />}
                      title="Search for notes"
                      description="Type to discover notes"
                      showCreateButton={false}
                    />
                  )
                ) : (
                  <>
                    <div className="border-t">
                      <h3 className="text-xs font-medium text-muted-foreground px-4 py-1.5">
                        Results
                      </h3>
                      <div>
                        {memoizedNotes.map((note, index) => (
                          <div
                            key={note._id || index}
                            className="flex border-b border-primary/20 hover:bg-primary/10 items-start gap-3 p-2 px-4 group cursor-pointer"
                            onClick={() => {
                              NProgress.start();
                              const finalSlug = note.slug;
                              router.push(
                                `/${(note.userId as IUser)?.userName}/${(note.collectionId as any)?.slug}/${finalSlug}`,
                              );
                              setOpen(false);
                            }}
                          >
                            <div className="flex-1 space-y-3">
                              <div className="w-full min-w-0">
                                <p className="line-clamp-1 font-medium text-lg">
                                  {note.name}
                                </p>
                                <p className="text-primary/70 text-sm line-clamp-3">
                                  {note.snippets}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex gap-1 items-center">
                                  <Folder
                                    className="text-muted-foreground fill-muted-foreground"
                                    size={14}
                                  />
                                  <p className="line-clamp-1 text-xs text-muted-foreground">
                                    {(note.collectionId as any)?.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <div className="relative size-4 shrink-0 rounded-full overflow-hidden bg-muted">
                                      <Image
                                        src={
                                          (note.userId as IUser)?.avatar ||
                                          "/avatar.svg"
                                        }
                                        alt={
                                          (note.userId as IUser)?.fullName ||
                                          "Author Profile Photo"
                                        }
                                        fill
                                        sizes="16px"
                                        className="object-cover"
                                        loading="lazy"
                                        fetchPriority="low"
                                      />
                                    </div>
                                    <span>
                                      {(note.userId as IUser)?.fullName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {pagination.notes.totalPages > 1 && (
                      <div className="border-t p-4 sticky bottom-0 bg-muted">
                        <CustomPagination
                          currentPage={pagination.notes.currentPage}
                          totalPages={pagination.notes.totalPages}
                          onPageChange={handleNotesPageChange}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent className="mt-0" value="users">
              <div className="max-h-[80vh] overflow-y-auto">
                {searchResults.users.length === 0 ? (
                  searchQuery && !isTyping ? (
                    isSearching ? (
                      <Searching searchQuery={searchQuery} type="users" />
                    ) : (
                      <NotFound searchQuery={searchQuery} type="users" />
                    )
                  ) : searchHistory.length === 0 ? (
                    <EmptyState
                      icon={<User />}
                      title="Search for users"
                      description="Type a name, username, or email to discover people"
                      showCreateButton={false}
                    />
                  ) : null
                ) : (
                  <>
                    <div className="p-1 border-t">
                      <h3 className="text-xs font-medium text-muted-foreground px-4 py-1.5">
                        Results
                      </h3>
                      <div className="space-y-1">
                        {searchResults.users.map((user, index) => (
                          <div
                            key={user._id || index}
                            onClick={() => {
                              addSearchHistory(user as any);
                              NProgress.start();
                              router.push(`/${user.userName}`);
                              setOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                          >
                            <div className="relative size-8 shrink-0 rounded-full overflow-hidden bg-muted">
                              <Image
                                src={user.avatar || "/avatar.svg"}
                                alt={user.fullName || "User Profile Photo"}
                                fill
                                sizes="32px"
                                className="object-cover"
                                loading="lazy"
                                fetchPriority="low"
                              />
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-1.5">
                                {user.fullName as string}
                                {user.role === "admin" && (
                                  <BadgeIcon className="size-4 text-blue-500" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{user.userName as string}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {pagination.users.totalPages > 1 && (
                      <div className="border-t p-4 sticky bottom-0 bg-muted">
                        <CustomPagination
                          currentPage={pagination.users.currentPage}
                          totalPages={pagination.users.totalPages}
                          onPageChange={handleUsersPageChange}
                        />
                      </div>
                    )}
                  </>
                )}

                {searchHistory.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-1">
                      <div className="flex items-center justify-between w-full px-4 py-1.5">
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Recent Searches
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-0.5 text-xs text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSearchHistory();
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.map((user, index) => (
                          <div
                            key={user._id || index}
                            onClick={() => {
                              NProgress.start();
                              router.push(`/${user.userName}`);
                              setOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-md cursor-pointer group"
                          >
                            <div className="relative">
                              <div className="relative size-10 shrink-0 rounded-full overflow-hidden">
                                <Image
                                  src={(user.avatar as string) || "/avatar.svg"}
                                  alt="Users Profile Photo"
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                  priority
                                />
                              </div>
                              <Clock className="absolute -bottom-1 -right-1 h-4 w-4 text-muted-foreground bg-muted rounded-full p-0.5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium flex items-center gap-1.5">
                                {user.fullName as string}
                                {user.role === "admin" && (
                                  <BadgeIcon className="size-4 text-blue-500" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{user.userName as string}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSearchHistory(user._id);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage <= 3) {
        pages.push(2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          "ellipsis",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages,
        );
      }
    }
    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function Searching({
  searchQuery = "",
  type = "users",
}: {
  searchQuery?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-6 animate-pulse">
      <div className="bg-primary/20 rounded-full p-5">
        <Search className="h-10 w-10 stroke-1.5 text-muted-foreground/80" />
      </div>
      <div className="text-center space-y-1 max-w-md px-4">
        <h3 className="text-xl font-medium tracking-tight">{`Searching for ${type}`}</h3>
        <p className="text-muted-foreground">{searchQuery}</p>
      </div>
      <div className="text-sm text-muted-foreground/60">
        <p>Try different keywords or check spelling</p>
      </div>
    </div>
  );
}

export function NotFound({
  searchQuery = "",
  type = "users",
}: {
  searchQuery?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-6">
      <div className="bg-primary/20 rounded-full p-5 animate-pulse">
        <Ghost className="h-10 w-10 stroke-1.5 text-muted-foreground/80" />
      </div>
      <div className="text-center space-y-1 max-w-md px-4">
        <h3 className="text-xl font-medium tracking-tight">
          {searchQuery ? "No results found" : `Search for ${type}`}
        </h3>
        <p className="text-muted-foreground">
          {searchQuery
            ? `No ${type} found for "${searchQuery}"`
            : type === "notes"
              ? "Type to discover notes"
              : "Type a name, username, or email to discover people"}
        </p>
      </div>
      <div className="text-sm text-muted-foreground/60">
        <p>Try different keywords or check spelling</p>
      </div>
    </div>
  );
}
