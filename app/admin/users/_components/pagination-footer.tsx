"use client";

import { useState, useMemo } from "react";
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

const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50];

interface PaginationFooterProps {
  // Data props — parent owns these
  totalItems: number;
  itemCount: number;
  isLoading?: boolean;
  currentPage: number;
  itemsPerPage: number;
  // Callbacks — so parent can react to page/size changes
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PaginationFooter = ({
  totalItems,
  itemCount,
  isLoading = false,
  currentPage,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
}: PaginationFooterProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginationPages = useMemo(() => {
    // Show at most 5 page numbers, centered around currentPage
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange(Number(value));
    onPageChange(1);
  };

  const rangeStart = (currentPage - 1) * itemsPerPage + (itemCount ? 1 : 0);
  const rangeEnd = (currentPage - 1) * itemsPerPage + itemCount;

  return (
    <div className="border-t h-16 sticky bottom-0 bg-background z-10 px-4 py-3">
      <div className="justify-between items-center gap-3 text-muted-foreground text-xs flex mx-auto max-w-7xl">
        <div className="flex items-center gap-2">
          <p>
            {rangeStart} – {rangeEnd} / {totalItems}
          </p>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue placeholder={DEFAULT_PAGE_SIZE.toString()} />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
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
                    handlePageChange(currentPage - 1);
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
                    handlePageChange(pageNumber);
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
                  if (hasNextPage && !isLoading)
                    handlePageChange(currentPage + 1);
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
    </div>
  );
};

export default PaginationFooter;
