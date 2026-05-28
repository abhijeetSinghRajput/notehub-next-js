"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BadgeIcon from "@/components/icons/BadgeIcon";
import Image from "next/image";
import Link from "next/link";
import { Trash, Ban, CheckCircle, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateUserDialog } from "./CreateUserDialog";
const PAGE_SIZE = 50;

export default function UserManagementPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "delete" | "ban" | "unban" | "assignRole";
    role?: "user" | "admin";
  }>({ isOpen: false, action: "delete" });
  const [confirmInput, setConfirmInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { fetchUsers, getCachedUsers, isLoadingUsers, usersError, batchUpdateUsers } = useAdminStore();

  const userQuery = useMemo(() => ({
    page: currentPage, limit: itemsPerPage, search, filter: "all" as const,
  }), [currentPage, search, itemsPerPage]);

  const usersResponse = getCachedUsers(userQuery);
  const users = usersResponse?.users ?? [];
  const pagination = usersResponse?.pagination ?? {
    currentPage, totalPages: 1, totalItems: 0, itemsPerPage: PAGE_SIZE, hasNextPage: false, hasPreviousPage: false,
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

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u._id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const openConfirmDialog = (action: "delete" | "ban" | "unban" | "assignRole", role?: "user" | "admin") => {
    setConfirmDialog({ isOpen: true, action, role });
    setConfirmInput("");
  };

  const handleBatchAction = async () => {
    if (!selectedIds.length) return;
    setIsProcessing(true);

    const { action, role } = confirmDialog;
    const result = await batchUpdateUsers(selectedIds, action, role);

    if (result.success) {
      toast.success(result.message || "Action successful");
      setSelectedIds([]);
      setConfirmDialog({ isOpen: false, action: "delete" });
      fetchUsers(userQuery, { force: true });
    } else {
      toast.error(result.message || "Action failed");
    }

    setIsProcessing(false);
  };

  // Helper to determine if input matches the required word for destructive actions
  const isConfirmValid = () => {
    if (confirmDialog.action === "delete") return confirmInput.toLowerCase() === "delete";
    if (confirmDialog.action === "ban") return confirmInput.toLowerCase() === "ban";
    return true; // assignRole and unban might not require strict typing, but we can enforce if needed.
  };

  return (
    <>
      <h1 className="sr-only">User Management</h1>
      <Card className="relative bg-background sm:bg-card shadow-none sm:shadow-md sm:border border-none">
        <CardHeader className="flex flex-row justify-between items-center p-0 sm:p-6 pb-6">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage your platform users, assign roles, and handle bans.</CardDescription>
          </div>
          <CreateUserDialog />
        </CardHeader>
        <CardContent className="space-y-4 p-0 sm:p-6 sm:pt-0">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by username, full name, or email"
          />

          {/* ── DESKTOP TABLE (sm and above) ── */}
          <div className="hidden sm:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Collections</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingUsers && users.length === 0) ? (
                  Array.from({ length: itemsPerPage }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="mx-auto rounded-sm w-5 h-5" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="rounded-full size-8" />
                          <Skeleton className="w-24 h-4" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-40 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-12 h-4" /></TableCell>
                      <TableCell><Skeleton className="rounded-full w-16 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-8 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-8 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users.map((user) => {
                    // user._id typing is standard in mongoose models
                    const isChecked = selectedIds.includes(user._id as string);
                    return (
                      <TableRow key={user._id} className={isChecked ? "bg-muted/50" : ""}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSelectUser(user._id as string)}
                            aria-label={`Select ${user.userName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/users/${user.userName}`} className="flex items-center gap-3 hover:underline">
                            <div className="relative size-8 shrink-0">
                              <div className="relative bg-muted rounded-full size-8 overflow-hidden shrink-0">
                                <Image
                                  src={user.avatar || "/avatar.svg"}
                                  alt={user.fullName || "User"}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {user.role === "admin" && (
                                <span className="-right-1 -bottom-1 absolute flex justify-center items-center bg-background shadow-sm p-0.5 border border-background rounded-full size-4">
                                  <BadgeIcon className="size-3 text-blue-500" />
                                </span>
                              )}
                            </div>
                            <p className="max-w-44 font-medium truncate">
                              {user.userName}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-56 truncate">{user.fullName}</TableCell>
                        <TableCell className="max-w-60 text-muted-foreground truncate">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground capitalize">{user.role}</TableCell>
                        <TableCell>
                          {user.isDeleted ? (
                            <span className="inline-flex items-center bg-gray-100 dark:bg-gray-900/30 px-2 py-0.5 rounded-full font-medium text-gray-700 dark:text-gray-400 text-xs">
                              Deleted
                            </span>
                          ) : user.isBanned ? (
                            <span className="inline-flex items-center bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full font-medium text-red-700 dark:text-red-400 text-xs">
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium text-green-700 dark:text-green-400 text-xs">
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.notesCount || 0}</TableCell>
                        <TableCell className="text-muted-foreground">{user.collectionsCount || 0}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {!isLoadingUsers && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-20 text-muted-foreground text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}

                {isLoadingUsers && users.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/30 h-10 text-muted-foreground text-xs text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="size-3 animate-spin" />
                        Refreshing users...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="sm:hidden flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b">
              <Checkbox
                checked={users.length > 0 && selectedIds.length === users.length}
                onCheckedChange={toggleSelectAll}
                id="select-all-mobile"
              />
              <label htmlFor="select-all-mobile" className="text-muted-foreground text-sm">Select All on Page</label>
            </div>

            {isLoadingUsers && users.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-3 border-b">
                  <Skeleton className="mx-auto rounded-sm w-5 h-5" />
                  <div className="flex flex-1 items-center gap-3">
                    <Skeleton className="rounded-full size-11" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-40 h-3" />
                      <Skeleton className="w-32 h-2" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              users.map((user, index) => {
                const isChecked = selectedIds.includes(user._id as string);
                return (
                  <div key={user._id} className={`flex items-center gap-3 px-1 py-3 ${index !== users.length - 1 ? "border-b" : ""} ${isChecked ? "bg-muted/30" : ""}`}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelectUser(user._id as string)}
                    />
                    <Link href={`/admin/users/${user.userName}`} className="flex flex-1 items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="relative rounded-full size-11 overflow-hidden shrink-0">
                          <Image src={user.avatar || "/avatar.svg"} alt={user?.fullName || "User"} fill sizes="44px" className="object-cover" priority />
                        </div>
                        {user.role === "admin" && (
                          <span className="-right-0.5 -bottom-0.5 absolute flex justify-center items-center bg-background p-0.5 rounded-full size-4.5">
                            <BadgeIcon className="size-4 text-blue-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="flex items-center gap-2 font-medium text-sm truncate leading-tight">
                          {user.fullName}
                          {user.isBanned && <span className="bg-red-500 rounded-full size-2" title="Banned"></span>}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">{user.email}</p>
                        <p className="mt-1 font-medium text-[10px] text-muted-foreground truncate">
                          {user.notesCount || 0} Notes • {user.collectionsCount || 0} Collections • Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}

            {!isLoadingUsers && users.length === 0 && (
              <div className="py-10 text-muted-foreground text-sm text-center">No users found.</div>
            )}

            {isLoadingUsers && users.length > 0 && (
              <div className="py-4 text-muted-foreground text-xs text-center animate-pulse">
                Refreshing list...
              </div>
            )}
          </div>

          {usersError && <p className="text-destructive text-xs">{usersError}</p>}

          {/* ── PAGINATION ── */}
          <div className="flex justify-between items-center gap-3 text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              <p>
                {(pagination.currentPage - 1) * pagination.itemsPerPage + (users.length ? 1 : 0)} –
                {(pagination.currentPage - 1) * pagination.itemsPerPage + users.length} / {pagination.totalItems}
              </p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-16 h-7 text-xs">
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

            <Pagination className="justify-end mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.hasPreviousPage && !isLoadingUsers) setCurrentPage((p) => Math.max(p - 1, 1));
                    }}
                    aria-disabled={!pagination.hasPreviousPage || isLoadingUsers}
                    className={!pagination.hasPreviousPage || isLoadingUsers ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {paginationPages.map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === pagination.currentPage}
                      onClick={(event) => { event.preventDefault(); setCurrentPage(pageNumber); }}
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
                      if (pagination.hasNextPage && !isLoadingUsers) setCurrentPage((p) => p + 1);
                    }}
                    aria-disabled={!pagination.hasNextPage || isLoadingUsers}
                    className={!pagination.hasNextPage || isLoadingUsers ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* ── BATCH ACTIONS BAR ── */}
          {selectedIds.length > 0 && (
            <div className="bottom-0 slide-in-from-bottom-2 z-10 sticky flex flex-wrap items-center gap-2 bg-card shadow-sm p-3 border rounded-md transition-all animate-in fade-in">
              <span className="mr-auto pl-2 font-medium text-sm">
                {selectedIds.length} user(s) selected
              </span>
              <Button variant="outline" size="sm" onClick={() => openConfirmDialog("assignRole", "admin")} className="h-8">
                <Shield className="mr-2 w-4 h-4" /> Make Admin
              </Button>
              <Button variant="outline" size="sm" onClick={() => openConfirmDialog("assignRole", "user")} className="h-8">
                <UserIcon className="mr-2 w-4 h-4" /> Make User
              </Button>
              <Button variant="outline" size="sm" onClick={() => openConfirmDialog("unban")} className="hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 h-8 text-green-700">
                <CheckCircle className="mr-2 w-4 h-4" /> Unban
              </Button>
              <Button variant="outline" size="sm" onClick={() => openConfirmDialog("ban")} className="hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 h-8 text-orange-700">
                <Ban className="mr-2 w-4 h-4" /> Ban
              </Button>
              <Button variant="destructive" size="sm" onClick={() => openConfirmDialog("delete")} className="h-8">
                <Trash className="mr-2 w-4 h-4" /> Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CONFIRMATION DIALOG ── */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to perform a batch action (<b>{confirmDialog.action}</b>) on <b>{selectedIds.length}</b> user(s).
              {confirmDialog.action === "delete" && " This action will soft delete the selected accounts. Their data will remain in the database."}
              {confirmDialog.action === "ban" && " This will prevent the selected users from logging in."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Require input for destructive actions */}
          {(confirmDialog.action === "delete" || confirmDialog.action === "ban") && (
            <div className="my-4">
              <p className="mb-2 text-sm">Please type <strong>{confirmDialog.action}</strong> to confirm.</p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type "${confirmDialog.action}"`}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBatchAction();
              }}
              disabled={isProcessing || !isConfirmValid()}
              className={confirmDialog.action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isProcessing ? "Processing..." : "Confirm Action"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
