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
import { AlertCircle, Clock, Eye, Loader2, MousePointerClick, RefreshCw } from "lucide-react";
import { Job } from "@/types/mailer.types";

interface DeliveryReportProps {
  jobs: Job[];
  jobsLoading: boolean;
  onRefresh: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

// ─── Small helpers ────────────────────────────────────────────

function TrackingCell({
  count,
  firstAt,
  icon: Icon,
  label,
  activeColor,
}: {
  count: number;
  firstAt: string | null;
  icon: React.ElementType;
  label: string;
  activeColor: string;
}) {
  if (count === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

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
        <div className={`flex items-center gap-1.5 cursor-default w-fit ${activeColor}`}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
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

// ─── Component ────────────────────────────────────────────────

export default function DeliveryReport({
  jobs,
  jobsLoading,
  onRefresh,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}: DeliveryReportProps) {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <span className="font-medium text-sm">Delivery jobs</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={jobsLoading}
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${jobsLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {jobsLoading && jobs.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Clock className="h-6 w-6" />
          <p className="text-sm">No delivery jobs yet</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed At</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    Opens
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    Clicks
                  </div>
                </TableHead>
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

                  {/* Opens */}
                  <TableCell>
                    <TrackingCell
                      count={job.openCount ?? 0}
                      firstAt={job.firstOpenedAt ?? null}
                      icon={Eye}
                      label="open"
                      activeColor="text-blue-500"
                    />
                  </TableCell>

                  {/* Clicks */}
                  <TableCell>
                    <TrackingCell
                      count={job.clickCount ?? 0}
                      firstAt={job.firstClickedAt ?? null}
                      icon={MousePointerClick}
                      label="click"
                      activeColor="text-violet-500"
                    />
                  </TableCell>

                  {/* Error */}
                  <TableCell className="text-muted-foreground text-xs">
                    {job.error ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <AlertCircle />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto max-w-md">
                          <p className="text-destructive text-sm">{job.error}</p>
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

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}