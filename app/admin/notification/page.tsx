"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAdminStore } from "@/app/stores/useAdminStore";
import type { IUser } from "@/types/model";

type TemplateId = "welcome" | "noteIndexed" | "issueFixed";

const templates: {
  id: TemplateId;
  name: string;
  emoji: string;
  description: string;
  subject: (title: string) => string;
  message: (title: string) => string;
}[] = [
  {
    id: "welcome",
    name: "Welcome",
    emoji: "✨",
    description: "Onboard newly joined users.",
    subject: () => "Welcome to NoteHub ✨",
    message: () =>
      "Welcome to NoteHub. You can now create notes, organize collections, and collaborate with your team.",
  },
  {
    id: "noteIndexed",
    name: "Note Indexed",
    emoji: "🔍",
    description: "Notify users when a note appears on Google Search.",
    subject: (title) => `Your note "${title || "Untitled"}" has been indexed on Google`,
    message: (title) =>
      `Great news — your note "${title || "Untitled"}" has been indexed on Google Search Engine.`,
  },
  {
    id: "issueFixed",
    name: "Issue Fixed",
    emoji: "✅",
    description: "Notify users their reported issue is fixed.",
    subject: (title) => `Update: ${title || "Your reported issue"} has been fixed ✅`,
    message: (title) =>
      `Congratulations! ${title || "Your reported issue"} has been fixed. Thank you for helping us improve NoteHub.`,
  },
];

const PAGE_SIZE = 10;

export default function NotificationPage() {
  const [activeTemplateId, setActiveTemplateId] = useState<TemplateId>("welcome");
  const [contentTitle, setContentTitle] = useState("Getting Started with NoteHub");
  const [subject, setSubject] = useState(templates[0].subject(""));
  const [message, setMessage] = useState(templates[0].message(""));
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersMap, setSelectedUsersMap] = useState<Record<string, IUser>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const { fetchUsers, getCachedUsers, isLoadingUsers, usersError } = useAdminStore();

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === activeTemplateId) ?? templates[0],
    [activeTemplateId],
  );

  const userQuery = useMemo(
    () => ({ page: currentPage, limit: itemsPerPage, search, filter: "all" as const }),
    [currentPage, search, itemsPerPage],
  );

  const usersResponse = getCachedUsers(userQuery);
  const users = usersResponse?.users ?? [];
  const pagination = usersResponse?.pagination ?? {
    currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGE_SIZE,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  useEffect(() => {
    setSubject(activeTemplate.subject(contentTitle));
    setMessage(activeTemplate.message(contentTitle));
  }, [activeTemplate, contentTitle]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    void fetchUsers(userQuery);
  }, [fetchUsers, userQuery]);

  const selectedUsers = useMemo(
    () => Object.values(selectedUsersMap).filter((u) => selectedUserIds.includes(u._id)),
    [selectedUserIds, selectedUsersMap],
  );

  const allPageSelected =
    users.length > 0 && users.every((u) => selectedUserIds.includes(u._id));
  const selectedPageCount = users.filter((u) => selectedUserIds.includes(u._id)).length;
  const selectAllCheckedState =
    selectedPageCount === 0 ? false : selectedPageCount === users.length ? true : "indeterminate";

  const paginationPages = useMemo(() => {
    const total = pagination.totalPages;
    const start = Math.max(1, pagination.currentPage - 1);
    const end = Math.min(total, start + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pagination.currentPage, pagination.totalPages]);

  const toggleUser = (user: IUser) => {
    setSelectedUserIds((prev) =>
      prev.includes(user._id) ? prev.filter((id) => id !== user._id) : [...prev, user._id],
    );
    setSelectedUsersMap((prev) => {
      const next = { ...prev };
      if (next[user._id]) delete next[user._id];
      else next[user._id] = user;
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    if (allPageSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !users.some((u) => u._id === id)));
      setSelectedUsersMap((prev) => {
        const next = { ...prev };
        users.forEach((u) => delete next[u._id]);
        return next;
      });
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...users.map((u) => u._id)])));
      setSelectedUsersMap((prev) => {
        const next = { ...prev };
        users.forEach((u) => (next[u._id] = u));
        return next;
      });
    }
  };

  return (
    /* Root: safe-area padding on mobile, normal on desktop */
    <div className="flex min-h-screen flex-col pb-24 sm:pb-0">
      {/* ── PAGE HEADER ── */}
      <div className="pt-5 sm:pt-0">
        <div className="mb-1 flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Notification Center
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Email Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a template, select users, and send bulk emails.
        </p>
      </div>

      {/* ── SEND BUTTON (desktop only — mobile is sticky bottom) ── */}
      <div className="hidden items-center justify-end pt-4 sm:flex">
        <Button disabled={selectedUserIds.length === 0} className="gap-2">
          <Send className="size-4" />
          Send Bulk Email
          {selectedUserIds.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selectedUserIds.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">

        {/* ════ LEFT PANEL: Builder ════ */}
        <Card className="border-none bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm">
          {/* Template chip row */}
          <div className="flex gap-2 overflow-x-auto pb-3 pt-4 sm:px-6 sm:pt-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplateId(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTemplateId === t.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{t.emoji}</span>
                {t.name}
              </button>
            ))}
          </div>

          <CardContent className="space-y-5 p-0 pb-6 sm:px-6 sm:pb-6">
            {/* Title + Subject */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="content-title" className="text-xs text-muted-foreground">
                  Title / Issue Name
                </Label>
                <Input
                  id="content-title"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="e.g. Advanced SEO Notes"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs text-muted-foreground">
                  Email Subject
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs text-muted-foreground">
                Message Body
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-24 resize-none text-sm"
              />
            </div>

            <Separator />

            {/* Recipients header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" />
                Recipients
                {selectedUserIds.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {selectedUserIds.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAllCheckedState}
                  onCheckedChange={toggleSelectAllOnPage}
                  aria-label="Select or unselect all users on page"
                />
                <button
                  onClick={toggleSelectAllOnPage}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  {allPageSelected ? "Deselect page" : "Select page"}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
                className="h-10 pl-9"
              />
            </div>

            {/* User list */}
            <div className="sm:overflow-hidden sm:rounded-xl sm:border">
              {isLoadingUsers && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Loading users…
                </div>
              )}
              {!isLoadingUsers && users.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No users found.
                </div>
              )}
              {users.map((user, i) => {
                const isSelected = selectedUserIds.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleUser(user)}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                      i !== users.length - 1 ? "border-b" : ""
                    } ${isSelected ? "bg-primary/5" : "hover:bg-muted/40 active:bg-muted/60"}`}
                  >
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback className="text-xs font-semibold">
                        {user.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                      aria-label={`Select ${user.fullName}`}
                    />
                  </div>
                );
              })}
            </div>

            {usersError && <p className="text-xs text-destructive">{usersError}</p>}

            {/* Pagination row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + (users.length ? 1 : 0)}–
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + users.length} / {" "}
                  {pagination.totalItems}
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {[5, 10, 15, 25, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasPreviousPage && !isLoadingUsers)
                          setCurrentPage((p) => Math.max(p - 1, 1));
                      }}
                      aria-disabled={!pagination.hasPreviousPage || isLoadingUsers}
                      className={
                        !pagination.hasPreviousPage || isLoadingUsers
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {paginationPages.map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === pagination.currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(n);
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasNextPage && !isLoadingUsers)
                          setCurrentPage((p) => p + 1);
                      }}
                      aria-disabled={!pagination.hasNextPage || isLoadingUsers}
                      className={
                        !pagination.hasNextPage || isLoadingUsers
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            {/* Selected user chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 pl-1 pr-2 py-0.5 text-xs"
                  >
                    <Avatar className="size-5">
                      <AvatarImage src={user.avatar} alt={user.userName} />
                      <AvatarFallback className="text-[10px]">
                        {user.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-24 truncate font-medium">{user.userName}</span>
                    <button
                      onClick={() =>
                        setSelectedUserIds((prev) => prev.filter((id) => id !== user._id))
                      }
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
                      aria-label={`Remove ${user.userName}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ════ RIGHT PANEL: Preview ════ */}
        <div>
          {/* Mobile: collapsible preview section */}
          <button
            className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 sm:hidden"
            onClick={() => setPreviewOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="size-4 text-muted-foreground" />
              Email Preview
            </div>
            {previewOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {/* Preview card — always visible on desktop, toggle on mobile */}
          <Card
            className={`border-none bg-background shadow-none sm:block sm:border sm:bg-card sm:shadow-sm ${
              previewOpen ? "mt-3 block" : "hidden"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-0 pb-3 pt-4 sm:px-6 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="size-4 text-muted-foreground" />
                Template Preview
              </CardTitle>
              <Badge variant="outline" className="gap-1 text-xs">
                {activeTemplate.emoji} {activeTemplate.name}
              </Badge>
            </CardHeader>

            <CardContent className="p-0 pb-6 sm:px-6">
              {/* Simulated email card */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                {/* Email meta */}
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    NoteHub Mailer
                  </p>
                  <Separator />
                </div>

                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">To:</span>{" "}
                    {selectedUsers[0]?.email ?? "recipient@notehub.dev"}
                    {selectedUserIds.length > 1 && (
                      <span className="ml-1 text-muted-foreground">
                        +{selectedUserIds.length - 1} more
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Subject:</span> {subject}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Hi there,</p>
                  <p className="leading-relaxed">{message}</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  Sent to{" "}
                  <span className="font-medium text-foreground">
                    {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""}
                  </span>{" "}
                  via bulk email.
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Ready for sending
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR (mobile only) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <Button
          disabled={selectedUserIds.length === 0}
          className="h-12 w-full gap-2 text-sm font-semibold"
        >
          <Send className="size-4" />
          {selectedUserIds.length === 0
            ? "Select users to send"
            : `Send to ${selectedUserIds.length} user${selectedUserIds.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}