"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, RefreshCcw } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import CloudinaryImage from "@/components/ui/cloudinary-image";

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

interface EmailPickerProps {
  selectedEmails: Set<string>;
  setSelectedEmails: React.Dispatch<React.SetStateAction<Set<string>>>;
  initialEmails?: string[];
}

export default function EmailPickerTabs({
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

  useEffect(() => {
    if (activeTab !== "copyPaste") return;
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      const userEmails = new Set(users.map((u) => u.email));
      for (const e of next) {
        if (!userEmails.has(e)) next.delete(e);
      }
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-3">
      <TabsList className="w-full" variant="line">
        <TabsTrigger value="users" className="flex-1">
          Users
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
              <p className="text-sm text-muted-foreground text-center">No users found</p>
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
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </TabsContent>

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
              <div key={email} className="flex items-center gap-2 px-3 py-2 border-b last:border-0">
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