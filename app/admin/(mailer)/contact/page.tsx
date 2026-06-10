"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import { Contact } from "@/types/mailer.types";
import PaginationFooter from "../../users/_components/pagination-footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatar: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_REGEX.test(e)),
    ),
  ];
}

// ─── Shared email picker tabs ────────────────────────────────────────────────
interface EmailPickerProps {
  selectedEmails: Set<string>;
  setSelectedEmails: React.Dispatch<React.SetStateAction<Set<string>>>;
  initialEmails?: string[];
}

function EmailPickerTabs({
  selectedEmails,
  setSelectedEmails,
  initialEmails,
}: EmailPickerProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pasteInput, setPasteInput] = useState(() =>
    (initialEmails ?? []).join("\n"),
  );
  const { getAllUsers } = useAuthStore();

  const parsedEmails = parseEmails(pasteInput);

  const fetchUsers = async (q = "") => {
    setUsersLoading(true);
    try {
      const response = await getAllUsers({
        page: 1,
        limit: 30,
        filter: "all",
        search: q,
      });
      setUsers(response.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const debouncedFetchUsers = useDebounceCallback(fetchUsers, 400);

  useEffect(() => {
    if (activeTab !== "users") return;
    if (!search.trim()) {
      fetchUsers("");
      return;
    }
    debouncedFetchUsers(search);
  }, [search, activeTab]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers("");
  }, [activeTab]);

  // Sync parsedEmails → selectedEmails whenever paste input changes
  useEffect(() => {
    if (activeTab !== "copyPaste") return;
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      // Remove emails that were previously added via paste but are no longer parsed
      // We track paste-sourced emails by comparing with parsedEmails
      // Simple strategy: replace all with union of users-tab picks + current parsedEmails
      // We keep emails that came from users tab (i.e. exist in `users` list) untouched
      const userEmails = new Set(users.map((u) => u.email));
      // Remove old paste emails (not in userEmails)
      for (const e of next) {
        if (!userEmails.has(e)) next.delete(e);
      }
      // Add newly parsed
      for (const e of parsedEmails) next.add(e);
      return next;
    });
  }, [pasteInput]);

  const toggleUser = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col gap-3"
    >
      <TabsList className="w-full" variant="line">
        <TabsTrigger value="users" className="flex-1">
          Users
          {/* count only user-sourced emails */}
          {users.filter((u) => selectedEmails.has(u.email)).length > 0 && (
            <Badge variant="secondary" className="ml-1.5">
              {users.filter((u) => selectedEmails.has(u.email)).length}
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
      </TabsList>

      {/* Users tab */}
      <TabsContent value="users" className="mt-0 space-y-2">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="border rounded-md max-h-56 overflow-y-auto">
          {usersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 bg-muted p-4">
              <p className="text-sm text-muted-foreground text-center">
                No users found
              </p>
              <Button size="sm" onClick={() => fetchUsers()}>
                <RefreshCcw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer"
                onClick={() => toggleUser(user.email)}
              >
                <Checkbox checked={selectedEmails.has(user.email)} />
                <div className="min-w-0 flex gap-2">
                  <div className="relative size-9 shrink-0 rounded-full overflow-hidden">
                    <CloudinaryImage
                      src={user.avatar || "/avatar.svg"}
                      alt={user.fullName || "User"}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate">
                      {user.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      {/* Copy Paste tab */}
      <TabsContent value="copyPaste" className="mt-0 space-y-2">
        <Textarea
          placeholder={`Paste emails separated by space, comma, or newline\n\nalice@example.com bob@example.com\ncarol@example.com, dave@example.com`}
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          className="h-40 resize-none font-mono"
        />
        <div className="border rounded-md max-h-36 overflow-y-auto">
          {parsedEmails.length === 0 ? (
            <p className="py-4 text-muted-foreground text-xs text-center">
              Valid emails will appear here
            </p>
          ) : (
            parsedEmails.map((email) => (
              <div
                key={email}
                className="flex items-center gap-2 px-3 py-2 border-b last:border-0"
              >
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{email}</span>
              </div>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

const LabelInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <label htmlFor="label" className="flex items-center gap-1 border-b">
    <div className="text-muted-foreground w-max shrink-0 text-sm">Label :</div>
    <Input
      id="label"
      value={value}
      placeholder="e.g. Beta users"
      className="bg-transparent! focus-visible:ring-0 shadow-none outline-none! border-none rounded-none"
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  </label>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createEmails, setCreateEmails] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmails, setEditEmails] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  // Details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchContacts = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/mailer/contacts", {
        params: { page, limit },
      });
      setContacts(data.contacts);
      setTotalItems(data.pagination.totalItems);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleCreate = async () => {
    if (!createLabel.trim()) return toast.error("Label is required");
    if (createEmails.size === 0) return toast.error("Select at least one user");
    setCreating(true);
    try {
      await axiosInstance.post("/mailer/contacts", {
        label: createLabel,
        emails: Array.from(createEmails),
      });
      toast.success("Contact group created");
      setCreateOpen(false);
      setCreateLabel("");
      setCreateEmails(new Set());
      fetchContacts();
    } catch {
      toast.error("Failed to create contact group");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact(contact);
    setEditLabel(contact.label);
    setEditEmails(new Set(contact.emails));
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingContact) return;
    if (!editLabel.trim()) return toast.error("Label is required");
    if (editEmails.size === 0) return toast.error("Select at least one email");
    setUpdating(true);
    try {
      const { data } = await axiosInstance.put(
        `/mailer/contacts/${editingContact._id}`,
        {
          label: editLabel,
          emails: Array.from(editEmails),
        },
      );
      toast.success("Contact group updated");
      setEditOpen(false);
      setContacts((prev) =>
        prev.map((c) => (c._id === editingContact._id ? data.contact : c)),
      );
    } catch {
      toast.error("Failed to update contact group");
    } finally {
      setUpdating(false);
    }
  };

  // Called when user clicks the trash icon — just opens the dialog
  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  // Called when user confirms inside the dialog
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/mailer/contacts/${deleteTarget}`);
      toast.success("Deleted");
      setContacts((prev) => prev.filter((c) => c._id !== deleteTarget));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Labeled groups of NoteHub users for campaigns
          </p>
        </div>

        {/* ── Create dialog ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
              <LabelInput value={createLabel} onChange={setCreateLabel} />
              <EmailPickerTabs
                selectedEmails={createEmails}
                setSelectedEmails={setCreateEmails}
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {createEmails.size} selected
                </span>
                <Button size="sm" onClick={handleCreate} disabled={creating}>
                  {creating && (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Users className="w-8 h-8" />
          <p className="text-sm">No contact groups yet</p>
        </div>
      ) : (
        <>
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
                <TableRow
                  key={c._id}
                  className="cursor-pointer"
                  onClick={() => openDetails(c)}
                >
                  <TableCell className="font-medium">{c.label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.emails.length} users</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right justify-end flex">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => openEdit(c, e)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => confirmDelete(c._id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ── Edit dialog ── */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Contact Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <LabelInput value={editLabel} onChange={setEditLabel} />
                {editOpen && (
                  <EmailPickerTabs
                    selectedEmails={editEmails}
                    setSelectedEmails={setEditEmails}
                    initialEmails={Array.from(editEmails)}
                  />
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {editEmails.size} selected
                  </span>
                  <Button size="sm" onClick={handleUpdate} disabled={updating}>
                    {updating && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ── Details dialog ── */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedContact?.label}</DialogTitle>
                {selectedContact && (
                  <DialogDescription>
                    <span className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(selectedContact.createdAt).toLocaleDateString()}
                    </span>
                  </DialogDescription>
                )}
              </DialogHeader>
              {selectedContact && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between gap-2 items-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Emails
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {selectedContact.emails.length} emails
                      </Badge>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    {selectedContact.emails.map((email) => (
                      <div
                        key={email}
                        className="hover:bg-muted/30 px-3 py-2 text-sm break-all border-b last:border-0"
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete contact group?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the contact group. Campaigns that
                  used it will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <PaginationFooter
        totalItems={totalItems}
        itemCount={contacts.length}
        isLoading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
