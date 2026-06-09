"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Template } from "@/types/mailer.types";
import { Skeleton } from "@/components/ui/skeleton";
import PaginationFooter from "../../users/_components/pagination-footer";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
            <p className="text-muted-foreground text-sm">
              Reusable Liquid-powered email layouts
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/template/new">
              <Plus className="mr-1 w-4 h-4" />
              New Template
            </Link>
          </Button>
        </div>

        {!loading && templates.length === 0 ? (
          <div className="flex flex-col justify-center items-center gap-2 py-16 text-muted-foreground">
            <FileText className="w-8 h-8" />
            <p className="text-sm">No templates yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 20 }).map((_, i) => (
                    <TableRow key={i} className="h-13.25">
                      <TableCell>
                        <Skeleton className="w-32 h-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-40 h-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-40 h-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="w-8 h-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : templates.map((t) => (
                    <TableRow
                      key={t._id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/template/${t._id}`)}
                    >
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t.subject}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t._id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
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
