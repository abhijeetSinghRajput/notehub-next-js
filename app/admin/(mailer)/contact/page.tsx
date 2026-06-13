"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { Contact } from "@/types/mailer.types";
import PaginationFooter from "../../users/_components/pagination-footer";
import CreateContactDialog from "./_components/create-contact-dialog";
import EditContactDialog from "./_components/edit-contact-dialog";
import ContactDetailsDialog from "./_components/contact-details-dialog";
import DeleteContactDialog from "./_components/delete-contact-dialog";
import ContactsTable from "./_components/contacts-table";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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

  const openEdit = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact(contact);
    setEditOpen(true);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

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
        <div className="flex gap-2 items-center">
          <Button
            variant={"outline"}
            disabled={loading}
            tooltip={"re fetch"}
            size="icon"
            onClick={() => fetchContacts(currentPage, itemsPerPage)}
            className="size-8"
          >
            <RotateCw className={cn(loading ? "animate-spin" : "")} />
          </Button>
        <CreateContactDialog
          onCreated={(contact) => {
            setContacts((prev) => [contact, ...prev]);
            setTotalItems((t) => t + 1);
          }}
          />
          </div>
      </div>

      <ContactsTable
        contacts={contacts}
        loading={loading}
        onRowClick={openDetails}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />

      <EditContactDialog
        contact={editingContact}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={(updated) => {
          setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        }}
      />

      <ContactDetailsDialog
        contact={selectedContact}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <DeleteContactDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

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