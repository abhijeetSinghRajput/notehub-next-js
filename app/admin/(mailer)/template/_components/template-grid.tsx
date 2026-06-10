"use client";

import { Template } from "@/types/mailer.types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import Image from "next/image";
import DeleteConfirmDialog from "./delete-confirm-dialog";

const FALLBACK = "https://placehold.net/main.svg";

interface Props {
  templates: Template[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function TemplateGrid({ templates, loading, onDelete }: Props) {
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

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {templates.map((t) => (
        <div
          key={t._id}
          className="bg-card border rounded-lg overflow-hidden cursor-pointer hover:border-foreground/30 transition-colors"
          onClick={() => router.push(`/admin/template/${t._id}`)}
        >
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
            <DeleteConfirmDialog
              iconSize="w-3.5 h-3.5"
              onConfirm={() => onDelete(t._id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
