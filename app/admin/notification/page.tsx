"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Mail, Search, Send, Users, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  description: string;
  subject: (title: string) => string;
  message: (title: string) => string;
}[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Onboard newly joined users with a clean welcome mail.",
    subject: () => "Welcome to NoteHub ✨",
    message: () =>
      "Welcome to NoteHub. You can now create notes, organize collections, and collaborate with your team.",
  },
  {
    id: "noteIndexed",
    name: "Note Indexed",
    description: "Notify users when a note appears on Google Search.",
    subject: (title) =>
      `Your note \"${title || "Untitled"}\" has been indexed on Google`,
    message: (title) =>
      `Great news — your note \"${title || "Untitled"}\" has been indexed on Google Search Engine.`,
  },
  {
    id: "issueFixed",
    name: "Issue Fixed / Congrats",
    description:
      "Congratulate and notify users that their reported issue is fixed.",
    subject: (title) =>
      `Update: ${title || "Your reported issue"} has been fixed ✅`,
    message: (title) =>
      `Congratulations! ${title || "Your reported issue"} has been fixed. Thank you for helping us improve NoteHub.`,
  },
];

const PAGE_SIZE = 10;

export default function NotificationPage() {
  const [activeTemplateId, setActiveTemplateId] =
    useState<TemplateId>("welcome");
  const [contentTitle, setContentTitle] = useState(
    "Getting Started with NoteHub",
  );
  const [subject, setSubject] = useState(templates[0].subject(""));
  const [message, setMessage] = useState(templates[0].message(""));
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersMap, setSelectedUsersMap] = useState<
    Record<string, IUser>
  >({});

  const { fetchUsers, getCachedUsers, isLoadingUsers, usersError } =
    useAdminStore();

  const activeTemplate = useMemo(
    () =>
      templates.find((template) => template.id === activeTemplateId) ??
      templates[0],
    [activeTemplateId],
  );

  const userQuery = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
      search,
      filter: "all" as const,
    }),
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
    () =>
      Object.values(selectedUsersMap).filter((user) =>
        selectedUserIds.includes(user._id),
      ),
    [selectedUserIds, selectedUsersMap],
  );

  const allPageSelected =
    users.length > 0 &&
    users.every((user) => selectedUserIds.includes(user._id));
  const selectedPageCount = users.filter((user) =>
    selectedUserIds.includes(user._id),
  ).length;
  const selectAllCheckedState =
    selectedPageCount === 0
      ? false
      : selectedPageCount === users.length
        ? true
        : "indeterminate";

  const paginationPages = useMemo(() => {
    const totalPages = pagination.totalPages;
    const start = Math.max(1, pagination.currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [pagination.currentPage, pagination.totalPages]);

  const toggleUser = (user: IUser) => {
    setSelectedUserIds((previous) =>
      previous.includes(user._id)
        ? previous.filter((id) => id !== user._id)
        : [...previous, user._id],
    );

    setSelectedUsersMap((previous) => {
      const next = { ...previous };
      if (next[user._id]) {
        delete next[user._id];
      } else {
        next[user._id] = user;
      }
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    if (allPageSelected) {
      setSelectedUserIds((previous) =>
        previous.filter((id) => !users.some((user) => user._id === id)),
      );

      setSelectedUsersMap((previous) => {
        const next = { ...previous };
        users.forEach((user) => {
          delete next[user._id];
        });
        return next;
      });

      return;
    }

    setSelectedUserIds((previous) => {
      const next = new Set(previous);
      users.forEach((user) => next.add(user._id));
      return Array.from(next);
    });

    setSelectedUsersMap((previous) => {
      const next = { ...previous };
      users.forEach((user) => {
        next[user._id] = user;
      });
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1">
            <Bell className="size-3.5" />
            Notification SaaS
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">
            Email Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a template, choose multiple users, and send bulk product
            emails.
          </p>
        </div>
        <Button disabled={selectedUserIds.length === 0} className="gap-2">
          <Send className="size-4" />
          Send Bulk Email
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Email Builder</CardTitle>
              <CardDescription>
                Minimal modern workflow for welcome, indexing, and
                issue-resolution mails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="content-title">Title / Issue Name</Label>
                  <Input
                    id="content-title"
                    value={contentTitle}
                    onChange={(event) => setContentTitle(event.target.value)}
                    placeholder="e.g. Advanced SEO Notes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-28"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="gap-2">
                    <Users className="size-4" />
                    Recipients ({selectedUserIds.length})
                  </Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectAllCheckedState}
                      onCheckedChange={toggleSelectAllOnPage}
                      aria-label="Select or unselect all users"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={toggleSelectAllOnPage}
                    >
                      {allPageSelected ? "Unselect All" : "Select All"}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute left-3 top-2.5 size-4" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search users by name or email"
                    className="pl-9"
                  />
                </div>

                <div>
                  {isLoadingUsers && (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      Loading users...
                    </div>
                  )}

                  {!isLoadingUsers && users.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      No users found.
                    </div>
                  )}

                  {users.length > 0 && (
                    <div className="">
                      {users.map((user) => {
                        const isSelected = selectedUserIds.includes(user._id);
                        return (
                          <div
                            key={user._id}
                            onClick={() => toggleUser(user)}
                            className={`relative flex items-center gap-2 border p-3 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/5"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {}}
                              onClick={(event) => event.stopPropagation()}
                              className="absolute top-2 right-2 rounded"
                              aria-label={`Select ${user.fullName}`}
                            />
                            <Avatar className="size-10">
                              <AvatarImage src={user.avatar} alt={user.fullName} />
                              <AvatarFallback>
                                {user.fullName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <p className="font-semibold truncate">
                                {user.fullName}
                              </p>
                              <p className="text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {usersError && (
                  <p className="text-xs text-destructive">{usersError}</p>
                )}

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <p>
                      Showing{" "}
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        (users.length ? 1 : 0)}
                      -
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        users.length}{" "}
                      of {pagination.totalItems}
                    </p>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-7 w-16 text-xs">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (pagination.hasPreviousPage && !isLoadingUsers) {
                              setCurrentPage((previous) =>
                                Math.max(previous - 1, 1),
                              );
                            }
                          }}
                          aria-disabled={
                            !pagination.hasPreviousPage || isLoadingUsers
                          }
                          className={
                            !pagination.hasPreviousPage || isLoadingUsers
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {paginationPages.map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === pagination.currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (pagination.hasNextPage && !isLoadingUsers) {
                              setCurrentPage((previous) => previous + 1);
                            }
                          }}
                          aria-disabled={
                            !pagination.hasNextPage || isLoadingUsers
                          }
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

                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-1.5 rounded-md border border-input bg-muted/50 px-2 py-1 text-xs"
                    >
                      <Avatar className="size-5">
                        <AvatarImage src={user.avatar} alt={user.userName} />
                        <AvatarFallback className="text-xs">
                          {user.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.userName}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedUserIds((prev) =>
                            prev.filter((id) => id !== user._id),
                          );
                        }}
                        className="ml-0.5 inline-flex items-center justify-center rounded p-0.5 hover:bg-muted transition-colors"
                        aria-label={`Remove ${user.userName}`}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="size-4" />
                  Template Preview
                </CardTitle>
                <CardDescription>
                  Modern minimal email view before sending.
                </CardDescription>
              </div>
              <div className="w-48">
                <Select
                  value={activeTemplateId}
                  onValueChange={(value) =>
                    setActiveTemplateId(value as TemplateId)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            {/* preview  */}
            <CardContent>
              <div className="rounded-lg border bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    NoteHub Mailer
                  </p>
                  <Badge variant="outline">{activeTemplate.name}</Badge>
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  To: {selectedUsers[0]?.email ?? "recipient@notehub.dev"}
                </p>
                <p className="mt-2 text-base font-semibold">{subject}</p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Hi there,
                </p>
                <p className="mt-3 text-sm leading-6">{message}</p>
                <div className="mt-5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Sent to {selectedUserIds.length} selected user(s) via bulk
                  email.
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Ready for sending
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
