"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, LayoutGrid, List, Plus, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { Template } from "@/types/mailer.types";
import PaginationFooter from "../../users/_components/pagination-footer";
import { cn } from "@/lib/utils";
import TemplateGrid from "./_components/template-grid";
import TemplateTable from "./_components/template-table";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();

  const fetchTemplates = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/mailer/templates", {
        params: { page, limit },
      });
      setTemplates(data.templates);
      setTotalItems(data.pagination.totalItems);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/mailer/templates/${id}`);
      toast.success("Deleted");
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <>
      <div className="space-y-4 p-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-xl">Templates</h1>
            <p className="hidden sm:block text-muted-foreground text-sm">
              Reusable Liquid-powered email layouts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={"outline"}
              disabled={loading}
              tooltip={"re fetch"}
              size="icon"
              onClick={() => fetchTemplates(currentPage, itemsPerPage)}
              className="size-8"
            >
              <RotateCw className={cn(loading ? "animate-spin" : "")} />
            </Button>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none h-9 w-9",
                  view === "grid" && "bg-muted",
                )}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none h-9 w-9 border-l",
                  view === "list" && "bg-muted",
                )}
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button asChild className="w-9 sm:w-auto">
              <Link href="/admin/template/new">
                <Plus />
                <span className="hidden sm:inline">New Template</span>
              </Link>
            </Button>
          </div>
        </div>

        {!loading && templates.length === 0 ? (
          <div className="flex flex-col justify-center items-center gap-2 py-16 text-muted-foreground">
            <FileText className="w-8 h-8" />
            <p className="text-sm">No templates yet</p>
          </div>
        ) : view === "grid" ? (
          <TemplateGrid
            templates={templates}
            loading={loading}
            onDelete={handleDelete}
          />
        ) : (
          <TemplateTable
            templates={templates}
            loading={loading}
            onDelete={handleDelete}
          />
        )}
      </div>

      <PaginationFooter
        totalItems={totalItems}
        itemCount={templates.length}
        isLoading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
      />
    </>
  );
}
