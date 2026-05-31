"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Eye,
  X,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Liquid } from "liquidjs";
import type { editor as monacoEditor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center bg-muted rounded-md h-52">
      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
    </div>
  ),
});

const liquidEngine = new Liquid({
  strictFilters: false,
  strictVariables: false,
});

// ─── Types ────────────────────────────────────────────────────

interface Template {
  _id: string;
  name: string;
  subject: string;
  htmlBody: string;
  mode: "shared" | "per_recipient";
}

interface Contact {
  _id: string;
  label: string;
  userIds: string[];
}

interface User {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatar: string;
}

// ─── JSON Validation ──────────────────────────────────────────

interface JsonError {
  message: string;
  line?: number;
  col?: number;
}

function validateExtraJson(
  raw: string,
  mode: "shared" | "per_recipient",
): JsonError[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return [
      { message: `Invalid JSON: ${(e as Error).message}`, line: 1, col: 1 },
    ];
  }

  if (mode === "per_recipient") {
    if (!Array.isArray(parsed)) {
      return [
        {
          message: "Per-recipient mode requires a JSON array [ ... ]",
          line: 1,
          col: 1,
        },
      ];
    }
    const errors: JsonError[] = [];
    (parsed as unknown[]).forEach((entry, i) => {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !("userId" in (entry as object))
      ) {
        // find approximate line by scanning for nth opening brace
        errors.push({
          message: `Entry [${i}] is missing required field "userId"`,
        });
      }
    });
    return errors;
  }

  return [];
}

// ─── useDebounce ──────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

// ─── RecipientSearch ──────────────────────────────────────────

interface RecipientSearchProps {
  selected: User[];
  onAdd: (user: User) => void;
  onRemove: (id: string) => void;
}

const RecipientSearch = ({
  selected,
  onAdd,
  onRemove,
}: RecipientSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await axiosInstance.get("/mailer/users", {
          params: { search: q, limit: 10 },
        });
        setResults(
          data.users.filter(
            (u: User) => !selected.some((s) => s._id === u._id),
          ),
        );
      } finally {
        setSearching(false);
      }
    },
    [selected],
  );

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-1.5 bg-muted py-0.5 pr-2 pl-1 rounded-full"
            >
              <div className="relative rounded-full size-5 overflow-hidden shrink-0">
                <Image
                  src={u.avatar || "/avatar.svg"}
                  alt={u.fullName}
                  fill
                  sizes="20px"
                  className="object-cover"
                />
              </div>
              <span className="font-medium text-xs">{u.fullName}</span>
              <button
                onClick={() => onRemove(u._id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="top-1/2 left-2.5 absolute w-4 h-4 text-muted-foreground -translate-y-1/2" />
        <Input
          className="pr-8 pl-8"
          placeholder="Search by name, username or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {(query || searching) && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="top-1/2 right-2.5 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
        {results.length > 0 && (
          <div className="top-[calc(100%+4px)] z-50 absolute bg-background shadow-lg border rounded-md w-full max-h-52 overflow-y-auto">
            {results.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  onAdd(user);
                  setQuery("");
                  setResults([]);
                }}
                className="flex items-center gap-2.5 hover:bg-muted px-3 py-2 cursor-pointer"
              >
                <div className="relative rounded-full size-8 overflow-hidden shrink-0">
                  <Image
                    src={user.avatar || "/avatar.svg"}
                    alt={user.fullName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{user.fullName}</p>
                  <p className="text-muted-foreground text-xs">
                    @{user.userName} · {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Recipients Dialog ────────────────────────────────────────

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

// ─── Preview Sheet ────────────────────────────────────────────

interface PreviewSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  previews: { label: string; html: string }[];
  subject: string;
}

const PreviewSheet = ({
  open,
  onOpenChange,
  previews,
  subject,
}: PreviewSheetProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const current = previews[index];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 w-full sm:max-w-2xl"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex justify-between items-center">
            <SheetTitle className="font-medium text-sm">
              Preview —{" "}
              <span className="font-normal text-muted-foreground">
                {subject || "No subject"}
              </span>
            </SheetTitle>
            {previews.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="w-16 text-muted-foreground text-xs text-center">
                  {current?.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  disabled={index === previews.length - 1}
                  onClick={() => setIndex((i) => i + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {previews.length > 1 && (
            <p className="text-muted-foreground text-xs">
              {index + 1} of {previews.length} recipients
            </p>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          {current ? (
            <iframe
              key={index}
              srcDoc={current.html}
              className="border-0 w-full h-full"
              title="Email preview"
            />
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground text-sm">
              No preview available
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ─── Main Page ────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState<{ label: string; html: string }[]>(
    [],
  );
  const [previewBuilding, setPreviewBuilding] = useState(false);

  // recipients dialog
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [contactId, setContactId] = useState("");

  // form
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [extraJson, setExtraJson] = useState("{\n  \n}");
  const [jsonErrors, setJsonErrors] = useState<JsonError[]>([]);
  const [devMode, setDevMode] = useState(false);
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, c] = await Promise.all([
          axiosInstance.get("/mailer/templates"),
          axiosInstance.get("/mailer/contacts"),
        ]);
        setTemplates(t.data.templates);
        setContacts(c.data.contacts);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedTemplate = templates.find((t) => t._id === templateId);
  const selectedContact = contacts.find((c) => c._id === contactId);

  const recipientCount =
    selectedUsers.length > 0
      ? selectedUsers.length
      : (selectedContact?.userIds.length ?? 0);

  const recipientLabel =
    selectedUsers.length > 0
      ? `${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`
      : selectedContact
        ? `${selectedContact.label} (${selectedContact.userIds.length})`
        : null;

        
  // auto-fill subject from template
  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = templates.find((t) => t._id === id);
    if (t && !subject) setSubject(t.subject);
    // reset json scaffold based on mode
    if (t?.mode === "per_recipient") {
      setExtraJson('[\n  {\n    "userId": "",\n    \n  }\n]');
    } else {
      setExtraJson("{\n  \n}");
    }
    setJsonErrors([]);
  };

  // validate + push monaco markers
  const runValidation = useCallback(
    (raw: string) => {
      if (!selectedTemplate) {
        setJsonErrors([]);
        return;
      }
      const errors = validateExtraJson(raw, selectedTemplate.mode);
      setJsonErrors(errors);

      // push to monaco if mounted
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelMarkers(
            model,
            "campaign",
            errors.map((e) => ({
              startLineNumber: e.line ?? 1,
              startColumn: e.col ?? 1,
              endLineNumber: e.line ?? 1,
              endColumn: 100,
              message: e.message,
              severity: monacoRef.current!.MarkerSeverity.Error,
            })),
          );
        }
      }
    },
    [selectedTemplate],
  );

  useEffect(() => {
    runValidation(extraJson);
  }, [extraJson, runValidation]);

  // build previews using liquidjs
  const buildPreviews = useCallback(async () => {
    if (!selectedTemplate) return toast.error("Select a template first");
    setPreviewBuilding(true);

    try {
      let extra: unknown;
      try {
        extra = JSON.parse(extraJson);
      } catch {
        return toast.error("Fix JSON first");
      }

      const results: { label: string; html: string }[] = [];

      if (selectedTemplate.mode === "per_recipient" && Array.isArray(extra)) {
        // render one preview per entry in the array
        for (let i = 0; i < Math.min((extra as unknown[]).length, 10); i++) {
          const entry = (extra as Record<string, unknown>[])[i];
          const ctx = {
            user: {
              fullName: entry.userId ? `User ${i + 1}` : "Unknown",
              userName: `user${i + 1}`,
              email: "",
              avatar: "",
              bio: "",
              skills: [],
            },
            extra: entry,
          };
          const html = await liquidEngine.parseAndRender(
            selectedTemplate.htmlBody,
            ctx,
          );
          results.push({ label: `Entry ${i + 1}`, html });
        }
      } else {
        // shared mode — one preview with a sample user
        const ctx = {
          user: {
            fullName: "Preview User",
            userName: "preview",
            email: "preview@notehub.com",
            avatar: "",
            bio: "",
            skills: [],
          },
          extra: extra as Record<string, unknown>,
        };
        const html = await liquidEngine.parseAndRender(
          selectedTemplate.htmlBody,
          ctx,
        );
        results.push({ label: "Preview", html });
      }

      setPreviews(results);
      setPreviewOpen(true);
    } catch (e) {
      toast.error(`Preview failed: ${(e as Error).message}`);
    } finally {
      setPreviewBuilding(false);
    }
  }, [selectedTemplate, extraJson]);

  const handleSend = async (andSend = false) => {
    if (!name.trim()) return toast.error("Campaign name is required");
    if (!templateId) return toast.error("Select a template");
    if (!subject.trim()) return toast.error("Subject is required");
    if (selectedUsers.length === 0 && !contactId)
      return toast.error("Select recipients");
    if (jsonErrors.length > 0)
      return toast.error("Fix JSON errors before sending");

    let parsed: unknown;
    try {
      parsed = JSON.parse(extraJson);
    } catch {
      return toast.error("Invalid JSON");
    }

    setSaving(true);
    try {
      let resolvedContactId = contactId;

      if (selectedUsers.length > 0) {
        const { data } = await axiosInstance.post("/mailer/contacts", {
          label: `__campaign_${Date.now()}`,
          userIds: selectedUsers.map((r) => r._id),
          description: "auto-generated",
        });
        resolvedContactId = data.contact._id;
      }

      const { data } = await axiosInstance.post("/mailer/campaigns", {
        name,
        templateId,
        contactId: resolvedContactId,
        extraJson: parsed,
        subject,
      });

      if (andSend) {
        await axiosInstance.post(`/mailer/campaigns/${data.campaign._id}/send`);
        toast.success("Campaign dispatched");
      } else {
        toast.success("Saved as draft");
      }

      router.push("/admin/campaign");
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previews={previews}
        subject={subject}
      />

      <RecipientsDialog
        open={recipientsDialogOpen}
        onOpenChange={setRecipientsDialogOpen}
        contacts={contacts}
        selectedUsers={selectedUsers}
        selectedContactId={contactId}
        onAddUser={(u) => setSelectedUsers((prev) => [u, ...prev])}
        onRemoveUser={(id) =>
          setSelectedUsers((prev) => prev.filter((r) => r._id !== id))
        }
        onSelectContact={(id) => {
          setContactId(id);
          setSelectedUsers([]);
        }}
        onConfirm={() => setRecipientsDialogOpen(false)}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-xl">New Campaign</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={buildPreviews}
            disabled={!templateId || previewBuilding}
          >
            {previewBuilding ? (
              <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
            ) : (
              <Eye className="mr-1.5 w-4 h-4" />
            )}
            Show preview
          </Button>
          <Button size="sm" onClick={() => handleSend(true)} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 w-4 h-4" />
            )}
            Send emails
          </Button>
        </div>
      </div>

      {/* Compose card */}
      <div className="bg-background mt-4 border rounded-lg divide-y">
        {/* From */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            From
          </span>
          <span className="text-sm">NoteHub</span>
        </div>

        {/* To */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            To
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecipientsDialogOpen(true)}
          >
            <Users className="mr-1.5 w-3.5 h-3.5" />
            {recipientLabel ? recipientLabel : "Select recipients"}
          </Button>
          {recipientCount > 0 && (
            <Badge variant="secondary">
              {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Subject */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            Subject
          </span>
          <Input
            placeholder="Enter subject — supports {{ user.fullName }}"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Campaign name */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            Name
          </span>
          <Input
            placeholder="Internal campaign name (e.g. June SEO Warning)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Template */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            Template
          </span>
          <div className="flex flex-1 items-center gap-2">
            <Select value={templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger disabled={loading}>
                {loading && <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />}
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    <span>{t.name}</span>
                    <Badge
                      variant={
                        t.mode === "per_recipient" ? "default" : "secondary"
                      }
                      className="ml-2 text-xs"
                    >
                      {t.mode === "per_recipient" ? "per recipient" : "shared"}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Extra JSON */}
        <div className="space-y-2 px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Extra JSON</span>
              {selectedTemplate && (
                <Badge
                  variant={
                    selectedTemplate.mode === "per_recipient"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {selectedTemplate.mode === "per_recipient"
                    ? "array · userId required"
                    : "shared object"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="dev-mode"
                className="text-muted-foreground text-xs"
              >
                Monaco
              </Label>
              <Switch
                id="dev-mode"
                checked={devMode}
                onCheckedChange={setDevMode}
              />
            </div>
          </div>

          {devMode ? (
            <div className="border rounded-md overflow-hidden">
              <MonacoEditor
                height="220px"
                language="json"
                value={extraJson}
                onChange={(val) => setExtraJson(val ?? "{}")}
                onMount={(editor, monaco) => {
                  
                  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    allowComments: false,
                    schemas: [
                      {
                        uri: "campaign-schema.json",
                        fileMatch: ["*"],
                        schema: {
                          type: "array",
                          items: {
                            type: "object",
                            required: ["userId"],
                            additionalProperties: true,
                            properties: {
                              userId: {
                                type: "string",
                                minLength: 1,
                              },
                            },
                          },
                        },
                      },
                    ],
                  });

                  editorRef.current = editor;
                  monacoRef.current = monaco;

                  const model = editor.getModel();
                  if (!model) return;

                  const syncJsonErrors = () => {
                    const owner = "campaign-json";

                    const markers = monaco.editor
                      .getModelMarkers({})
                      .filter(
                        (m) => m.resource.toString() === model.uri.toString(),
                      )
                      .map((m) => ({
                        ...m,
                        severity: monaco.MarkerSeverity.Error,
                      }));

                    monaco.editor.setModelMarkers(model, owner, markers);
                  };

                  syncJsonErrors();

                  const disposable = monaco.editor.onDidChangeMarkers(() => {
                    syncJsonErrors();
                  });

                  editor.onDidDispose(() => {
                    disposable.dispose();
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  formatOnPaste: true,
                }}
                theme="vs-dark"
              />
            </div>
          ) : (
            <textarea
              className="bg-background p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-full min-h-32 font-mono text-sm resize-none"
              value={extraJson}
              onChange={(e) => setExtraJson(e.target.value)}
            />
          )}

          {/* Error banner */}
          {jsonErrors.length > 0 && (
            <div className="space-y-1 bg-destructive/5 px-3 py-2 border border-destructive/40 rounded-md">
              {jsonErrors.map((e, i) => (
                <p key={i} className="text-destructive text-xs">
                  ❌ {e.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          onClick={() => handleSend(false)}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
          ) : (
            <FileText className="mr-1.5 w-4 h-4" />
          )}
          Save as draft
        </Button>
        <Button onClick={() => handleSend(true)} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 w-4 h-4" />
          )}
          Send emails
        </Button>
      </div>
    </>
  );
}
