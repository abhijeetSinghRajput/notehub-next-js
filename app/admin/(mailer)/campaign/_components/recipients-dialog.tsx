"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import { Contact, User } from "../new/page";
import RecipientSearch from "./recipient-search";

interface RecipientsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contacts: Contact[];
  selectedUsers: User[];
  selectedContactId: string;
  onAddUser: (u: User) => void;
  onRemoveUser: (id: string) => void;
  onSelectContact: (id: string) => void;
  onConfirm: () => void;
}

const RecipientsDialog = ({
  open,
  onOpenChange,
  contacts,
  selectedUsers,
  selectedContactId,
  onAddUser,
  onRemoveUser,
  onSelectContact,
  onConfirm,
}: RecipientsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Select Recipients</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="users">
        <TabsList className="w-full">
          <TabsTrigger value="users" className="flex-1">
            Users
            {selectedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {selectedUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex-1">
            Contact Group
            {selectedContactId && (
              <Badge variant="secondary" className="ml-1.5">
                1
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <RecipientSearch
            selected={selectedUsers}
            onAdd={onAddUser}
            onRemove={onRemoveUser}
          />
          {selectedUsers.length === 0 && (
            <p className="py-6 text-muted-foreground text-xs text-center">
              Search and add individual users
            </p>
          )}
        </TabsContent>

        <TabsContent value="contact" className="space-y-2 mt-4">
          {contacts.length === 0 ? (
            <p className="py-6 text-muted-foreground text-xs text-center">
              No contact groups yet
            </p>
          ) : (
            contacts.map((c) => (
              <div
                key={c._id}
                onClick={() =>
                  onSelectContact(c._id === selectedContactId ? "" : c._id)
                }
                className={`flex items-center justify-between px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${
                  selectedContactId === c._id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{c.label}</span>
                </div>
                <Badge variant="secondary">{c.userIds.length} users</Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default RecipientsDialog;
