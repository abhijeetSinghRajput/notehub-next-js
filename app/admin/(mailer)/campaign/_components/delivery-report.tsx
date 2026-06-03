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
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { Job } from "@/types/mailer.types";


interface DeliveryReportProps {
  jobs: Job[];
  jobsLoading: boolean;
  onRefresh: () => void;
}

export default function DeliveryReport({
  jobs,
  jobsLoading,
  onRefresh,
}: DeliveryReportProps) {
  const sentCount = jobs.filter((j) => j.status === "sent").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const pendingCount = jobs.filter((j) => j.status === "pending").length;

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 font-medium text-sm">
            <Users className="w-4 h-4" />
            Delivery Report
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={jobsLoading}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${
                jobsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {jobs.length > 0 && (
          <div className="text-muted-foreground text-sm">
            {sentCount} sent · {failedCount} failed · {pendingCount} pending
          </div>
        )}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed At</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job._id}>
                <TableCell className="text-muted-foreground">
                  {job.email}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      job.status === "sent"
                        ? "default"
                        : job.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {job.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {job.processedAt
                    ? new Date(job.processedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—"}
                </TableCell>

                <TableCell className="max-w-50 truncate text-muted-foreground text-xs">
                  {job.error ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <AlertCircle />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="end"
                        className="w-auto max-w-md"
                      >
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
      )}
    </div>
  );
}