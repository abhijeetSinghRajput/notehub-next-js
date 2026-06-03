"use client";

import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { axiosInstance } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash, Loader2, Trash2, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface SuppressedEmail {
  _id: string;
  email: string;
  campaignId?: {
    _id: string;
    name: string;
    subject: string;
  } | string | null;
  createdAt: string;
}

function getCampaignLabel(campaignId: SuppressedEmail["campaignId"]) {
  if (!campaignId) return "No campaign";
  if (typeof campaignId === "string") return campaignId;
  return campaignId.name;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export default function SuppressionListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [data, setData] = useState<SuppressedEmail[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 50,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      opts?.silent ? setIsRefreshing(true) : setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (search) params.campaign = search;
        const res = await axiosInstance.get("/mailer/suppressed-emails", {
          params,
        });
        setData(res.data.data);
        setMeta({
          total: res.data.total,
          page: res.data.page,
          limit: res.data.limit,
        });
      } catch {
        setError("Failed to load suppression list.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, itemsPerPage, search],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginationPages = useMemo(() => {
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length && data.length > 0)
      setSelectedIds([]);
    else setSelectedIds(data.map((r) => r._id));
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsProcessing(true);
    try {
      const emails = data
        .filter((r) => selectedIds.includes(r._id))
        .map((r) => r.email);
      await axiosInstance.delete("/mailer/suppressed-emails", {
        data: { emails },
      });
      toast.success(`Removed ${emails.length} email(s) from suppression list.`);
      setSelectedIds([]);
      setConfirmOpen(false);
      void fetchData({ silent: true });
    } catch {
      toast.error("Failed to delete selected emails.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleDelete = async (email: string) => {
    try {
      await axiosInstance.delete("/mailer/suppressed-emails", {
        data: { email },
      });
      toast.success(`Removed ${email} from suppression list.`);
      void fetchData({ silent: true });
    } catch {
      toast.error("Failed to remove email.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-xl">Unsubscribers</h1>
            <p className="text-muted-foreground text-sm">
              Emails that have unsubscribed and will not receive future
              campaigns.
            </p>
          </div>
        </div>

        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Filter by campaign ID…"
        />

        {/* ── DESKTOP TABLE ── */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={
                      data.length > 0 && selectedIds.length === data.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Unsubscribed At</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && data.length === 0
                ? Array.from({
                    length: itemsPerPage > 10 ? 10 : itemsPerPage,
                  }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="mx-auto rounded-sm w-5 h-5" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-48 h-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-32 h-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-24 h-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-8 h-4" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.map((row) => {
                    const isChecked = selectedIds.includes(row._id);
                    const campaignId = row.campaignId;
                    let campaignContent: ReactNode = "—";

                    if (
                      typeof campaignId === "object" &&
                      campaignId !== null
                    ) {
                      campaignContent = (
                        <Link
                          href={`/admin/campaign/${campaignId._id}`}
                          className="flex gap-1 items-center hover:underline"
                        >
                          {campaignId.name}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      );
                    } else if (typeof campaignId === "string") {
                      campaignContent = campaignId;
                    }
                    return (
                      <TableRow
                        key={row._id}
                        className={isChecked ? "bg-muted/50" : ""}
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSelect(row._id)}
                            aria-label={`Select ${row.email}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-60 font-mono text-sm truncate">
                          {row.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaignContent}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-destructive"
                            tooltip="Re Subscribe"
                            onClick={() => handleSingleDelete(row.email)}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-20 text-muted-foreground text-center"
                  >
                    No suppressed emails found.
                  </TableCell>
                </TableRow>
              )}

              {isRefreshing && data.length > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="bg-muted/30 h-10 text-muted-foreground text-xs text-center"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="size-3 animate-spin" />
                      Refreshing...
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── MOBILE LIST ── */}
        <div className="sm:hidden flex flex-col">
          <div className="flex items-center gap-2 p-2 border-b">
            <Checkbox
              checked={data.length > 0 && selectedIds.length === data.length}
              onCheckedChange={toggleSelectAll}
              id="select-all-mobile"
            />
            <label
              htmlFor="select-all-mobile"
              className="text-muted-foreground text-sm"
            >
              Select All on Page
            </label>
          </div>

          {isLoading && data.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-1 py-3 border-b"
                >
                  <Skeleton className="rounded-sm w-5 h-5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-48 h-4" />
                    <Skeleton className="w-32 h-3" />
                  </div>
                </div>
              ))
            : data.map((row, index) => {
                const isChecked = selectedIds.includes(row._id);
                return (
                  <div
                    key={row._id}
                    className={`flex items-center gap-3 px-1 py-3 ${index !== data.length - 1 ? "border-b" : ""} ${isChecked ? "bg-muted/30" : ""}`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(row._id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate">{row.email}</p>
                      <p className="mt-0.5 text-muted-foreground text-xs truncate">
                        {getCampaignLabel(row.campaignId)} •{" "}
                        {new Date(row.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleSingleDelete(row.email)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}

          {!isLoading && data.length === 0 && (
            <div className="py-10 text-muted-foreground text-sm text-center">
              No suppressed emails found.
            </div>
          )}

          {isRefreshing && data.length > 0 && (
            <div className="py-4 text-muted-foreground text-xs text-center animate-pulse">
              Refreshing list...
            </div>
          )}
        </div>

        {error && <p className="text-destructive text-xs">{error}</p>}

        {/* ── PAGINATION ── */}
        <div className="flex justify-between items-center gap-3 text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <p>
              {(currentPage - 1) * meta.limit + (data.length ? 1 : 0)}–
              {(currentPage - 1) * meta.limit + data.length} / {meta.total}
            </p>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue placeholder="50" />
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
                  onClick={(e) => {
                    e.preventDefault();
                    if (hasPreviousPage && !isLoading)
                      setCurrentPage((p) => Math.max(p - 1, 1));
                  }}
                  aria-disabled={!hasPreviousPage || isLoading}
                  className={
                    !hasPreviousPage || isLoading
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
              {paginationPages.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
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
                  onClick={(e) => {
                    e.preventDefault();
                    if (hasNextPage && !isLoading) setCurrentPage((p) => p + 1);
                  }}
                  aria-disabled={!hasNextPage || isLoading}
                  className={
                    !hasNextPage || isLoading
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* ── BATCH ACTIONS BAR ── */}
        {selectedIds.length > 0 && (
          <div className="bottom-0 slide-in-from-bottom-2 z-10 sticky flex flex-wrap items-center gap-2 bg-card shadow-sm p-3 border rounded-md transition-all animate-in fade-in">
            <span className="mr-auto pl-2 font-medium text-sm">
              {selectedIds.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmOpen(true);
                setConfirmInput("");
              }}
              className="h-8"
            >
              <Trash className="mr-2 w-4 h-4" /> Remove
            </Button>
          </div>
        )}
      </div>

      {/* ── CONFIRM DIALOG ── */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && setConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove <b>{selectedIds.length}</b> email(s) from
              the suppression list. They will be eligible to receive future
              campaigns again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <p className="mb-2 text-sm">
              Please type <strong>delete</strong> to confirm.
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder='Type "delete"'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              disabled={isProcessing || confirmInput.toLowerCase() !== "delete"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Removing...
                </>
              ) : (
                "Confirm Action"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
