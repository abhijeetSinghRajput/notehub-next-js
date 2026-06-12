"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, RotateCw } from "lucide-react";
import Link from "next/link";
import DeliveryReport from "./_components/delivery-report";
import CampaignTable from "./_components/campaign-table";
import { cn } from "@/lib/utils";
import PaginationFooter from "../../users/_components/pagination-footer";
import { useCampaignStore } from "@/app/stores/useCampaignStore";

export default function CampaignPage() {
  const {
    campaigns,
    loading,
    currentPage,
    itemsPerPage,
    totalItems,
    jobsDialog,
    jobs,
    jobsLoading,
    dialogPagination,
    dialogLoadingMore,
    fetchCampaigns,
    fetchJobs,
    setCurrentPage,
    setItemsPerPage,
    setJobsDialog,
  } = useCampaignStore();

  useEffect(() => {
    fetchCampaigns(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

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
            variant={"outline"}
            disabled={loading}
            tooltip={"re fetch"}
            size="icon"
            onClick={() => fetchCampaigns(currentPage, itemsPerPage)}
            className="size-8"
          >
            <RotateCw className={cn(loading ? "animate-spin" : "")} />
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/campaign/new">
              <Plus className="mr-1 w-4 h-4" /> New Campaign
            </Link>
          </Button>
        </div>
      </div>

      <CampaignTable />

      <Dialog open={!!jobsDialog} onOpenChange={() => setJobsDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[70vh] px-4 overflow-y-auto pt-10">
          <DeliveryReport
            jobs={jobs}
            jobsLoading={jobsLoading}
            onRefresh={() => jobsDialog && fetchJobs(jobsDialog, 1)}
            hasMore={dialogPagination.hasMore}
            onLoadMore={() => jobsDialog && fetchJobs(jobsDialog, dialogPagination.page + 1)}
            loadingMore={dialogLoadingMore}
          />
        </DialogContent>
      </Dialog>

      <PaginationFooter
        totalItems={totalItems}
        itemCount={campaigns.length}
        isLoading={loading}
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