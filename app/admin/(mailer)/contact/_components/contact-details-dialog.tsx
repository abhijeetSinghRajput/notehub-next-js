"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { Contact } from "@/types/mailer.types";

interface ContactDetailsDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactDetailsDialog({
  contact,
  open,
  onOpenChange,
}: ContactDetailsDialogProps) {
  const [emails, setEmails] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    if (!contact) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get(
        `/mailer/contacts/${contact._id}/emails`,
      );
      setEmails(data.emails);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load emails";
      toast.error(message);
      setError(message);
      setEmails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !contact) {
      setEmails(null);
      setError(null);
      return;
    }
    fetchEmails();
  }, [open, contact]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact?.label}</DialogTitle>
          {contact && (
            <DialogDescription>
              <span className="text-xs text-muted-foreground">
                Created {new Date(contact.createdAt).toLocaleDateString()}
              </span>
            </DialogDescription>
          )}
        </DialogHeader>
        {contact && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between gap-2 items-center">
              <p className="text-sm font-medium text-muted-foreground">
                Emails
              </p>
              <Badge variant="secondary">
                {loading
                  ? "…"
                  : `${emails?.length ?? contact.emailCount ?? 0} emails`}
              </Badge>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-2 py-6 px-4">
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                  <Button size="sm" variant="outline" onClick={fetchEmails}>
                    <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Retry
                  </Button>
                </div>
              ) : (
                emails?.map((email) => (
                  <div
                    key={email}
                    className="hover:bg-muted/30 px-3 py-2 text-sm break-all border-b last:border-0"
                  >
                    {email}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
