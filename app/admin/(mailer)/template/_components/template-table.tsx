"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "nextjs-toploader/app";
import { Template } from "@/types/mailer.types";
import DeleteConfirmDialog from "./delete-confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface Props {
  templates: Template[];
  loading: boolean;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

export default function TemplateTable({
  templates,
  loading,
  onDelete,
  onBulkDelete,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // single delete id
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const router = useRouter();

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pr-0"><Skeleton className="size-5 border rounded-sm"/></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }).map((_, i) => (
            <TableRow key={i} className="h-13.25">
              <TableCell className="pr-0">
                <Skeleton className="size-5 border rounded-sm" />
              </TableCell>
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
          ))}
        </TableBody>
      </Table>
    );
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === templates.length && templates.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(templates.map((u) => u._id as string));
    }
  };

  const toggleSelectTemplate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const isSelectionMode = selectedIds.length > 0;

  const handleSingleConfirm = () => {
    if (deleteTarget) onDelete(deleteTarget);
    setDeleteTarget(null);
  };

  const handleBulkConfirm = () => {
    onBulkDelete(selectedIds);
    setBulkDeleteOpen(false);
    setSelectedIds([]);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <Checkbox
                checked={
                  templates.length > 0 &&
                  selectedIds.length === templates.length
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => {
            const isChecked = selectedIds.includes(t._id as string);
            return (
              <TableRow
                key={t._id}
                onClick={() => router.push(`/admin/template/${t._id}`)}
                className={cn("cursor-pointer", isChecked && "bg-muted/50")}
              >
                <TableCell
                  className="text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() =>
                      toggleSelectTemplate(t._id as string)
                    }
                    className="cursor-pointer hover:border-foreground/50"
                  />
                </TableCell>
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
                      setDeleteTarget(t._id as string);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* ── BATCH ACTIONS BAR ── */}
      {isSelectionMode && (
        <div className="border-t min-h-16 z-50 sticky bottom-0 slide-in-from-bottom-2 bg-card px-4 py-3 transition-all animate-in fade-in">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <div className="mr-auto flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedIds.length} selected
              </span>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="px-2 text-xs gap-1"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="px-2 text-xs gap-1"
              onClick={clearSelection}
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      {/* ── SINGLE MOUNTED DIALOG, shared for row delete + bulk delete ── */}
      <DeleteConfirmDialog
        open={deleteTarget !== null || bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setBulkDeleteOpen(false);
          }
        }}
        title={bulkDeleteOpen ? `Delete ${selectedIds.length} templates?` : "Delete template?"}
        description={
          bulkDeleteOpen
            ? "This action cannot be undone. The selected templates will be permanently deleted."
            : "This action cannot be undone. The template will be permanently deleted."
        }
        onConfirm={bulkDeleteOpen ? handleBulkConfirm : handleSingleConfirm}
      />
    </>
  );
}