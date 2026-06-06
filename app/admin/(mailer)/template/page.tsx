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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Template } from "@/types/mailer.types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTemplates = async () => {
    try {
      const { data } = await axiosInstance.get("/mailer/templates");
      setTemplates(data.templates);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

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
  );
}
