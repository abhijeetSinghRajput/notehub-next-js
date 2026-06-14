"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Job } from "@/types/mailer.types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCampaignStore } from "@/app/stores/useCampaignStore";
import { useCampaignSocket } from "@/hooks/useCampaignSocket";
import { Skeleton } from "@/components/ui/skeleton";

type JobsFilter = { status?: string; sortBy?: string; sortOrder?: string };

// ─── Small helpers ────────────────────────────────────────────

function TrackingCell({
  count,
  firstAt,
  label,
  activeColor,
}: {
  count: number;
  firstAt: string | null;
  label: string;
  activeColor: string;
}) {
  if (count === 0) return <span className="text-muted-foreground">—</span>;

  const formattedTime = firstAt
    ? new Date(firstAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-1.5 cursor-default w-fit ${activeColor}`}
        >
          <span className="text-sm font-medium tabular-nums">{count}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {formattedTime
          ? `First ${label} at ${formattedTime}`
          : `${count} ${label}${count > 1 ? "s" : ""}`}
      </TooltipContent>
    </Tooltip>
  );
}

function SortableHead({
  label,
  field,
  filter,
  onFilterChange,
}: {
  label: string;
  field: string;
  filter: JobsFilter;
  onFilterChange: (f: JobsFilter) => void;
}) {
  const isActive = filter.sortBy === field;
  const isDesc = isActive && filter.sortOrder === "desc";

  const handleClick = () => {
    if (!isActive) {
      onFilterChange({ ...filter, sortBy: field, sortOrder: "asc" });
    } else if (!isDesc) {
      onFilterChange({ ...filter, sortBy: field, sortOrder: "desc" });
    } else {
      const { sortBy, sortOrder, ...rest } = filter;
      onFilterChange(rest);
    }
  };

  return (
    <TableHead className="cursor-pointer select-none" onClick={handleClick}>
      <div className="flex items-center gap-1.5">
        {label}
        {isActive ? (
          isDesc ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )
        ) : null}
      </div>
    </TableHead>
  );
}

// ─── Component ────────────────────────────────────────────────

export default function DeliveryReport({
  campaignId,
  hideTitle,
}: {
  campaignId: string;
  hideTitle?: boolean;
}) {
  const {
    jobs,
    jobsLoading,
    jobsLoadingMore,
    jobsPagination,
    jobsFilter,
    setJobsFilter,
    setJobs,
    fetchJobs,
  } = useCampaignStore();

  useCampaignSocket({
    campaignId,
    onJob: (job) => {
      setJobs((prev) => {
        const idx = prev.findIndex((j) => j._id === job._id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...job };
          return updated;
        }
        return [...prev, job as Job];
      });
    },
  });

  const onFilterChange = (f: JobsFilter) => {
    setJobsFilter(f);
    fetchJobs(campaignId, 1, f);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        {!hideTitle && (
          <span className="font-medium text-sm">Delivery jobs</span>
        )}
        <div className="flex gap-2 items-center">
          <Select
            value={jobsFilter.status ?? "All"}
            onValueChange={(v) =>
              onFilterChange({
                ...jobsFilter,
                status: v === "All" ? undefined : v,
              })
            }
          >
            <SelectTrigger className="w-32 text-left">
              <div className="flex gap-2 items-center">
                <Filter className="size-3.5" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                {["All", "pending", "sent", "failed", "skipped"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchJobs(campaignId, 1)}
            disabled={jobsLoading}
            tooltip="Refresh"
          >
            <RefreshCw className={jobsLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {jobsLoading && jobs.length === 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed At</TableHead>
              <TableHead>Opens</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Error</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 20 }).map((_, i) => (
              <TableRow key={i} className="h-10">
                <TableCell>
                  <Skeleton className="w-40 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-10 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-22 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-10 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-10 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="size-5 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Clock className="h-6 w-6" />
          <p className="text-sm">No delivery jobs yet</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8">#</TableHead>
                <SortableHead
                  label="Email"
                  field="email"
                  filter={jobsFilter}
                  onFilterChange={onFilterChange}
                />
                <TableHead>Status</TableHead>
                <TableHead>Processed at</TableHead>
                <SortableHead
                  label="Opens"
                  field="openCount"
                  filter={jobsFilter}
                  onFilterChange={onFilterChange}
                />
                <TableHead>Clicks</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {jobs.map((job, index) => (
                <TableRow key={job._id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {job.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        job.status === "sent"
                          ? "success"
                          : job.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {job.processedAt
                      ? new Date(job.processedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <TrackingCell
                      count={job.openCount ?? 0}
                      firstAt={job.firstOpenedAt ?? null}
                      label="open"
                      activeColor="text-blue-500"
                    />
                  </TableCell>
                  <TableCell>
                    <TrackingCell
                      count={job.clickCount ?? 0}
                      firstAt={job.firstClickedAt ?? null}
                      label="click"
                      activeColor="text-violet-500"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {job.error ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <AlertCircle />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto max-w-md">
                          <p className="text-destructive text-sm">
                            {job.error}
                          </p>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {jobsPagination.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchJobs(campaignId, jobsPagination.page + 1)}
                disabled={jobsLoadingMore}
              >
                {jobsLoadingMore ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
