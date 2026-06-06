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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCcw, Trash2, Users } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import { Contact } from "@/types/mailer.types";

interface User {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatar: string;
}

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // form state
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEmails, setselectedEmails] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { getAllUsers } = useAuthStore();

  const fetchContacts = async () => {
    try {
      const { data } = await axiosInstance.get("/mailer/contacts");
      setContacts(data.contacts);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

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
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!open) return;

    if (!search.trim()) {
      fetchUsers("");
      return;
    }

    debouncedFetchUsers(search);
  }, [search, open, debouncedFetchUsers]);

  const toggleUser = (email: string) => {
    setselectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!label.trim()) return toast.error("Label is required");
    if (selectedEmails.size === 0)
      return toast.error("Select at least one user");
    setCreating(true);
    try {
      await axiosInstance.post("/mailer/contacts", {
        label,
        description,
        emails: Array.from(selectedEmails),
      });
      toast.success("Contact group created");
      setOpen(false);
      setLabel("");
      setDescription("");
      setselectedEmails(new Set());
      fetchContacts();
    } catch {
      toast.error("Failed to create contact group");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/mailer/contacts/${id}`);
      toast.success("Deleted");
      setContacts((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openContactDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Labeled groups of NoteHub users for campaigns
          </p>
        </div>
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
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Label (e.g. Beta Users)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {usersLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 border bg-muted p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No users found
                    </p>
                    <Button size="sm" onClick={() => fetchUsers()}>
                      <RefreshCcw />
                      Retry
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
                            alt={user?.fullName || "User"}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.userName} · {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selectedEmails.size} selected
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
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow
                  key={c._id}
                  className="cursor-pointer"
                  onClick={() => openContactDetails(c)}
                >
                  <TableCell className="font-medium">{c.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.emails.length} users</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(c._id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedContact?.label}</DialogTitle>
                <DialogDescription>
                  {selectedContact?.description || "—"}
                </DialogDescription>
              </DialogHeader>
              {selectedContact && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between gap-2 items-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Emails
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {selectedContact.emails.length} emails
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created{" "}
                          {new Date(
                            selectedContact.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-md border">
                      {selectedContact.emails.map((email) => (
                        <div
                          key={email}
                          className="hover:bg-muted/30 px-3 py-2 text-sm break-all"
                        >
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
