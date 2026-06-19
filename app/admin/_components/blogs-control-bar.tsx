"use client";

import { Search, Award, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import SortSelector from "@/components/SortSelector";

type Props = {
  search: string;
  onSearchChange: (val: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  setSortBy: (val: string) => void;
  toggleSortDirection: () => void;
  shownCount: number;
  totalCount: number;
};

export default function BlogsControlBar({
  search,
  onSearchChange,
  sortBy,
  sortDirection,
  setSortBy,
  toggleSortDirection,
  shownCount,
  totalCount,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl w-full">
        <div className="relative flex-1 max-w-85 w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or SEO target…"
            className="pl-8"
          />
        </div>
        <SortSelector
          sortBy={sortBy}
          sortDirection={sortDirection}
          setSortBy={setSortBy}
          toggleSortDirection={toggleSortDirection}
          options={[
            { value: "seo", label: "SEO Score", icon: Award },
            { value: "created", label: "Date Created", icon: Calendar },
            { value: "updated", label: "Updated", icon: Clock },
          ]}
        />
      </div>
      <div className="text-[12px] text-muted-foreground/80 font-medium select-none shrink-0 md:text-right">
        Showing {shownCount} of {totalCount} blogs
      </div>
    </div>
  );
}
