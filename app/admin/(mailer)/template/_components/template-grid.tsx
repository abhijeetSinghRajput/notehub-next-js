"use client";

import { Template } from "@/types/mailer.types";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import DeleteConfirmDialog from "./delete-confirm-dialog";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const FALLBACK = "https://placehold.net/main.svg";

interface Props {
  templates: Template[];
  loading: boolean;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

export default function TemplateGrid({
  templates,
  loading,
  onDelete,
  onBulkDelete,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-lg overflow-hidden animate-pulse"
          >
            <div className="bg-muted w-full aspect-[3/4]" />
            <div className="p-3 border-t space-y-1.5">
              <div className="bg-muted h-3 w-3/4 rounded" />
              <div className="bg-muted h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isSelectionMode = selectedIds.length > 0;

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {templates.map((t) => {
          const isChecked = selectedIds.includes(t._id as string);

          return (
            <div
              key={t._id}
              className={cn(
                "relative bg-card border rounded-lg overflow-hidden cursor-pointer hover:border-foreground/30 transition-all",
                isSelectionMode && !isChecked && "opacity-70",
                isChecked && "ring-2 ring-primary border-primary",
              )}
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelectTemplate(t._id as string);
                } else {
                  router.push(`/admin/template/${t._id}`);
                }
              }}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleSelectTemplate(t._id as string)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "absolute size-5.5 z-10 top-2 right-2 bg-[#888]! opacity-100! cursor-pointer hover:border-foreground/50 backdrop-blur-sm transition-opacity",
                  !isSelectionMode &&
                    "opacity-0 group-hover:opacity-100 hover:opacity-100",
                )}
              />
              <img
                src={t.previewImage || FALLBACK}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK;
                }}
                alt={`${t.name} preview`}
                className="w-full aspect-3/4 object-cover object-top block bg-muted"
              />
              <div className="p-2.5 border-t flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.subject}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(t._id as string);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BATCH ACTIONS BAR ── */}
      {isSelectionMode && (
        <div className="border-t min-h-16 z-50 sticky bottom-0 slide-in-from-bottom-2 bg-card px-4 py-3 transition-all animate-in fade-in">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <div className="mr-auto flex items-center gap-2">
              <Checkbox
                checked={selectedIds.length === templates.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.length} selected
              </span>
            </div>
            <Button
              variant="outline"
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

      {/* ── SINGLE MOUNTED DIALOG ── */}
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