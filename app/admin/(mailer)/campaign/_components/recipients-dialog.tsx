"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Users, X, Mail, Loader2 } from "lucide-react";
import type { IUser as User } from "@/types/model";
import RecipientSearch from "./recipient-search";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import { Contact } from "@/types/mailer.types";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

interface RecipientsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contacts: Contact[];
  onConfirm: (emails: string[]) => void;
}

const RecipientsDialog = ({
  open,
  onOpenChange,
  contacts,
  onConfirm,
}: RecipientsDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pasteInput, setPasteInput] = useState("");
  const [contactId, setContactId] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const [contactEmails, setContactEmails] = useState<string[]>([]);
  const [contactEmailsLoading, setContactEmailsLoading] = useState(false);

  const parsedEmails = [...new Set(
    pasteInput
      .split(/[\s,\n]+/)
      .map((e) => e.trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
  )];

  const selectedContact = contacts.find((c) => c._id === contactId);

  // Fetch emails on demand when a contact group is selected
  useEffect(() => {
    if (!contactId) {
      setContactEmails([]);
      return;
    }
    const fetchEmails = async () => {
      setContactEmailsLoading(true);
      try {
        const { data } = await axiosInstance.get(
          `/mailer/contacts/${contactId}/emails`,
        );
        setContactEmails(data.emails);
      } catch {
        toast.error("Failed to load contact emails");
        setContactEmails([]);
      } finally {
        setContactEmailsLoading(false);
      }
    };
    fetchEmails();
  }, [contactId]);

  const handleConfirm = () => {
    let emails: string[] = [];
    if (activeTab === "users") {
      emails = users.map((u) => u.email);
    } else if (activeTab === "copyPaste") {
      emails = parsedEmails;
    } else if (activeTab === "contact") {
      emails = contactEmails;
    }
    onConfirm(emails);
    onOpenChange(false);
  };

  const confirmDisabled =
    (activeTab === "users" && users.length === 0) ||
    (activeTab === "copyPaste" && parsedEmails.length === 0) ||
    (activeTab === "contact" && (!contactId || contactEmailsLoading || contactEmails.length === 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-150 p-0 gap-0 flex flex-col">
        <DialogHeader className="shrink-0 bg-muted/30 p-4">
          <DialogTitle>Select Recipients</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="w-full shrink-0 bg-muted/30" variant="line">
            <TabsTrigger value="users" className="flex-1">
              Users
              {users.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {users.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="copyPaste" className="flex-1">
              Copy Paste
              {parsedEmails.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {parsedEmails.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex-1">
              Contact Group
              {contactId && (
                <Badge variant="secondary" className="ml-1.5">
                  1
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent
            value="users"
            className="flex px-6 flex-col flex-1 min-h-0 mt-4"
          >
            <div className="shrink-0">
              <RecipientSearch
                selected={users}
                onAdd={(u) => setUsers((prev) => [u, ...prev])}
                onRemove={(id) => setUsers((prev) => prev.filter((r) => r._id !== id))}
              />
            </div>
            <div className="flex-1 overflow-y-auto mt-3">
              {users.length === 0 ? (
                <p className="py-6 text-muted-foreground text-xs text-center">
                  Search and add individual users
                </p>
              ) : (
                <div className="space-y-1">
                  {users.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/40"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative size-8 shrink-0 rounded-full overflow-hidden">
                          <CloudinaryImage
                            src={u.avatar || "/avatar.svg"}
                            alt={u.fullName || "User"}
                            fill
                            sizes="40px"
                            className="object-cover"
                            preload
                            fetchPriority="high"
                          />
                        </div>
                        <div className="min-w-0">
                          {u.fullName && (
                            <p className="text-sm font-medium truncate">{u.fullName}</p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setUsers((prev) => prev.filter((r) => r._id !== u._id))}
                        size="icon"
                        variant="ghost"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Copy Paste Tab */}
          <TabsContent
            value="copyPaste"
            className="flex px-6 flex-col flex-1 min-h-0 mt-4 overflow-hidden"
          >
            <Textarea
              placeholder={`Paste emails separated by space, comma, or newline\n\nalice@example.com bob@example.com\ncarol@example.com, dave@example.com`}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              className="shrink-0 h-52 resize-none font-mono"
            />
            <div className="flex-1 overflow-y-auto mt-3">
              {parsedEmails.length === 0 ? (
                <p className="py-6 text-muted-foreground text-xs text-center">
                  Valid emails will appear here
                </p>
              ) : (
                <div className="space-y-1">
                  {parsedEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40"
                    >
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contact Group Tab */}
          <TabsContent
            value="contact"
            className="flex px-6 flex-col flex-1 min-h-0 mt-4"
          >
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="shrink-0">
                <SelectValue placeholder="Pick a contact group" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    <span>{c.label}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {c.emailCount}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 overflow-y-auto mt-3">
              {!selectedContact ? (
                <p className="py-6 text-muted-foreground text-xs text-center">
                  Select a group to preview its addresses
                </p>
              ) : contactEmailsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {contactEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40"
                    >
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end py-2 px-4 shrink-0 border-t">
          <Button size="sm" onClick={handleConfirm} disabled={confirmDisabled}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipientsDialog;