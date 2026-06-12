"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import LabelInput from "./label-input";
import EmailPickerTabs from "./email-picker-tabs";
import { Contact } from "@/types/mailer.types";

interface CreateContactDialogProps {
  onCreated: (contact: Contact) => void;
}

export default function CreateContactDialog({ onCreated }: CreateContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [emails, setEmails] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!label.trim()) return toast.error("Label is required");
    if (emails.size === 0) return toast.error("Select at least one user");
    setCreating(true);
    try {
      const { data } = await axiosInstance.post("/mailer/contacts", {
        label,
        emails: Array.from(emails),
      });
      toast.success("Contact group created");
      setOpen(false);
      setLabel("");
      setEmails(new Set());
      onCreated(data.contact);
    } catch {
      toast.error("Failed to create contact group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Contact Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2 overflow-hidden">
          <LabelInput value={label} onChange={setLabel} />
          {open && <EmailPickerTabs selectedEmails={emails} setSelectedEmails={setEmails} />}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">{emails.size} selected</span>
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}