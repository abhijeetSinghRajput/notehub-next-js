"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdminStore } from "@/app/stores/useAdminStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BadgeIcon from "@/components/icons/BadgeIcon";
import Image from "next/image";

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { fetchUsers, getCachedUsers, isLoadingUsers, usersError } =
    useAdminStore();

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

  const paginationPages = useMemo(() => {
    const totalPages = pagination.totalPages;
    const start = Math.max(1, pagination.currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [pagination.currentPage, pagination.totalPages]);

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

  return (
    <>
      <h1 className="sr-only">User Management</h1>
      <Card className="border-none shadow-none bg-background sm:bg-card sm:border sm:shadow-md">
        <CardHeader className="p-0  pb-6 sm:p-6 ">
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Paginated users from admin endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0 sm:p-6 sm:pt-0">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by username, full name, or email"
          />

          {/* ── DESKTOP TABLE (sm and above) ── */}
          <div className="hidden sm:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-8 shrink-0 rounded-full overflow-hidden bg-muted">
                          <Image
                            src={user.avatar || "/avatar.svg"}
                            alt={user.fullName || "User"}
                            fill
                            sizes="32px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="max-w-44 truncate font-medium">
                          {user.userName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">
                      {user.fullName}
                    </TableCell>
                    <TableCell className="max-w-60 truncate text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {user.role}
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoadingUsers && users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}

                {isLoadingUsers && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-20 text-center text-muted-foreground"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── MOBILE LIST (below sm) ── */}
          <div className="flex flex-col sm:hidden">
            {users.map((user, index) => (
              <div
                key={user._id}
                className={`flex items-center gap-3 px-1 py-3 ${
                  index !== users.length - 1 ? "border-b" : ""
                }`}
              >
                {/* Avatar with optional admin badge */}
                <div className="relative shrink-0">
                  <div className="relative size-11 shrink-0 rounded-full overflow-hidden">
                    <Image
                      src={user.avatar || "/avatar.svg"}
                      alt={user?.fullName || "User"}
                      fill
                      sizes="44px"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {user.role === "admin" && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-background">
                      <BadgeIcon className="size-4 text-blue-500" />
                    </span>
                  )}
                </div>

                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}

            {!isLoadingUsers && users.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            )}

            {isLoadingUsers && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading users...
              </div>
            )}
          </div>

          {usersError && (
            <p className="text-xs text-destructive">{usersError}</p>
          )}

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <p>
                {(pagination.currentPage - 1) * pagination.itemsPerPage +
                  (users.length ? 1 : 0)}
                –
                {(pagination.currentPage - 1) * pagination.itemsPerPage +
                  users.length}{" "}
                / {pagination.totalItems}
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
                        setCurrentPage((previous) => Math.max(previous - 1, 1));
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
        </CardContent>
      </Card>
    </>
  );
}
