"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import LabelInput from "./label-input";
import EmailPickerTabs from "./email-picker-tabs";
import { Contact } from "@/types/mailer.types";

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (contact: Contact) => void;
}

export default function EditContactDialog({
  contact,
  open,
  onOpenChange,
  onUpdated,
}: EditContactDialogProps) {
  const [label, setLabel] = useState("");
  const [emails, setEmails] = useState<Set<string>>(new Set());
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!open || !contact) return;
    setLabel(contact.label);
    setEmails(new Set());

    const fetchEmails = async () => {
      setLoadingEmails(true);
      try {
        const { data } = await axiosInstance.get(
          `/mailer/contacts/${contact._id}/emails`,
        );
        setEmails(new Set(data.emails));
      } catch {
        toast.error("Failed to load emails");
      } finally {
        setLoadingEmails(false);
      }
    };
    fetchEmails();
  }, [open, contact]);

  const handleUpdate = async () => {
    if (!contact) return;
    if (!label.trim()) return toast.error("Label is required");
    if (emails.size === 0) return toast.error("Select at least one email");
    setUpdating(true);
    try {
      const { data } = await axiosInstance.put(`/mailer/contacts/${contact._id}`, {
        label,
        emails: Array.from(emails),
      });
      toast.success("Contact group updated");
      onOpenChange(false);
      onUpdated(data.contact);
    } catch {
      toast.error("Failed to update contact group");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Contact Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <LabelInput value={label} onChange={setLabel} />
          {loadingEmails ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            open && (
              <EmailPickerTabs
                selectedEmails={emails}
                setSelectedEmails={setEmails}
                initialEmails={Array.from(emails)}
              />
            )
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">{emails.size} selected</span>
            <Button size="sm" onClick={handleUpdate} disabled={updating || loadingEmails}>
              {updating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}