"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, Users } from "lucide-react";
import { Contact } from "@/types/mailer.types";

interface ContactsTableProps {
  contacts: Contact[];
  loading: boolean;
  onRowClick: (contact: Contact) => void;
  onEdit: (contact: Contact, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function ContactsTable({
  contacts,
  loading,
  onRowClick,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Users className="w-8 h-8" />
        <p className="text-sm">No contact groups yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Users</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Action</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((c) => (
          <TableRow key={c._id} className="cursor-pointer" onClick={() => onRowClick(c)}>
            <TableCell className="font-medium">{c.label}</TableCell>
            <TableCell>
              <Badge variant="secondary">{c.emailCount ?? 0} users</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(c.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right justify-end flex">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={(e) => onEdit(c, e)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => onDelete(c._id, e)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}