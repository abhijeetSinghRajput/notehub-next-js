"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "nextjs-toploader/app";
import { Template } from "@/types/mailer.types";
import DeleteConfirmDialog from "./delete-confirm-dialog";

interface Props {
  templates: Template[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function TemplateTable({ templates, loading, onDelete }: Props) {
  const router = useRouter();

  if (loading) {
    return (
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
          {Array.from({ length: 20 }).map((_, i) => (
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
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
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
        {templates.map((t) => (
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
              <DeleteConfirmDialog onConfirm={() => onDelete(t._id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
