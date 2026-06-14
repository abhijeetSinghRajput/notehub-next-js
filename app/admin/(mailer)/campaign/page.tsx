"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, RotateCw } from "lucide-react";
import Link from "next/link";
import DeliveryReport from "./_components/campaign-job-table";
import CampaignTable from "./_components/campaign-table";
import { cn } from "@/lib/utils";
import PaginationFooter from "../../users/_components/pagination-footer";
import { useCampaignStore } from "@/app/stores/useCampaignStore";

export default function CampaignPage() {
  const {
    campaigns,
    fetchingCampaign,
    currentPage,
    itemsPerPage,
    totalItems,
    fetchCampaigns,
    setCurrentPage,
    setItemsPerPage,
    setJobs,
    setJobsFilter,
    fetchJobs,
  } = useCampaignStore();

  const [jobsSheet, setJobsSheet] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleSheetClose = () => {
    setJobsSheet(null);
    setJobs(() => []);
    setJobsFilter({});
  };

  const handleSheetOpen = (id: string) => {
    setJobsSheet(id);
    fetchJobs(id, 1, { sortBy: "openCount", sortOrder: "desc" });
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-xl">Campaigns</h1>
          <p className="hidden sm:block text-muted-foreground text-sm">
            Send targeted emails to contact groups
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            disabled={fetchingCampaign}
            tooltip="Re-fetch"
            size="icon"
            onClick={() => fetchCampaigns(currentPage, itemsPerPage)}
            className="size-8"
          >
            <RotateCw className={cn(fetchingCampaign ? "animate-spin" : "")} />
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/campaign/new">
              <Plus className="mr-1 w-4 h-4" /> New Campaign
            </Link>
          </Button>
        </div>
      </div>

      <CampaignTable onViewJobs={handleSheetOpen} />

      <Sheet open={!!jobsSheet} onOpenChange={handleSheetClose}>
        <SheetContent
          side="right"
          className="w-full p-0 sm:max-w-2xl flex flex-col gap-0 overflow-hidden!"
        >
          <SheetHeader className="shrink-0 mb-4 p-4 pb-0">
            <SheetTitle>Delivery jobs</SheetTitle>
          </SheetHeader>
          {jobsSheet && (
            <div className="p-4 flex-1 min-h-0 overflow-y-auto">
              <DeliveryReport campaignId={jobsSheet} hideTitle />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PaginationFooter
        totalItems={totalItems}
        itemCount={campaigns.length}
        isLoading={fetchingCampaign}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
