"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, Eye, FileText, Users, Code2, Braces } from "lucide-react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Liquid } from "liquidjs";
import PreviewSheet from "../_components/preview-sheet";
import RecipientsDialog from "../_components/recipients-dialog";
import { cn } from "@/lib/utils";
import { TEMPLATE_GLOBALS } from "@/lib/mailer-globals";
import { Contact, Template } from "@/types/mailer.types";

const liquidEngine = new Liquid({ strictFilters: false, strictVariables: false });

// ─── Types ────────────────────────────────────────────────────

export interface JsonError {
  message: string;
}

// ─── JSON validation ──────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateExtraJson(raw: string): { errors: JsonError[]; isPerRecipient: boolean } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      errors: [{ message: `Invalid JSON: ${(e as Error).message}` }],
      isPerRecipient: false,
    };
  }

  if (Array.isArray(parsed)) {
    const errors: JsonError[] = [];
    (parsed as unknown[]).forEach((entry, i) => {
      if (typeof entry !== "object" || entry === null) {
        errors.push({ message: `Entry [${i}] must be an object` });
        return;
      }
      const e = entry as Record<string, unknown>;
      if (typeof e.email !== "string" || !EMAIL_RE.test(e.email)) {
        errors.push({
          message: `Entry [${i}] is missing a valid "email" field`,
        });
      }
    });
    return { errors, isPerRecipient: true };
  }

  if (typeof parsed === "object" && parsed !== null) {
    return { errors: [], isPerRecipient: false };
  }

  return {
    errors: [{ message: "Extra JSON must be an object { } or an array [ ]" }],
    isPerRecipient: false,
  };
}

// ─── Monaco JSON markers ──────────────────────────────────────

function setMonacoJsonMarkers(
  monaco: typeof import("monaco-editor"),
  model: import("monaco-editor").editor.ITextModel,
  errors: JsonError[]
) {
  const markers = errors.map((e, i) => ({
    severity: monaco.MarkerSeverity.Error,
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 1,
    message: e.message,
    source: "campaign",
  }));
  monaco.editor.setModelMarkers(model, "campaign", markers);
}

// ─── Tab types ────────────────────────────────────────────────

type EditorTab = "html" | "json";

// ─── Main Page ────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // editor state
  const [activeTab, setActiveTab] = useState<EditorTab>("html");
  const [htmlBody, setHtmlBody] = useState("<p>Hello {{ extra.name }},</p>\n");
  const [extraJson, setExtraJson] = useState("{}");
  const [jsonErrors, setJsonErrors] = useState<JsonError[]>([]);
  const [isPerRecipient, setIsPerRecipient] = useState(false);

  // monaco refs
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const jsonModelRef = useRef<import("monaco-editor").editor.ITextModel | null>(null);

  // preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState<{ label: string; html: string; subject: string }[]>([]);
  const [previewBuilding, setPreviewBuilding] = useState(false);

  // recipients (manual select — disabled when per-recipient extraJson is active)
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [manualEmails, setManualEmails] = useState<string[]>([]);

  // form
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");

  // ─── Derived recipient list ──────────────────────────────────

  const derivedEmails = useCallback((): string[] => {
    if (!isPerRecipient) return manualEmails;
    try {
      const parsed = JSON.parse(extraJson);
      if (Array.isArray(parsed)) {
        return [
          ...new Set(
            parsed
              .map((e: Record<string, unknown>) =>
                typeof e.email === "string" ? e.email.trim().toLowerCase() : null
              )
              .filter(Boolean) as string[]
          ),
        ];
      }
    } catch {}
    return [];
  }, [isPerRecipient, extraJson, manualEmails]);

  const recipientEmails = derivedEmails();
  const recipientCount = recipientEmails.length;

  // ─── Load data ───────────────────────────────────────────────

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

  // ─── JSON validation effect ──────────────────────────────────

  useEffect(() => {
    const { errors, isPerRecipient: ipr } = validateExtraJson(extraJson);
    setJsonErrors(errors);
    setIsPerRecipient(ipr);

    // Update Monaco markers if model is mounted
    if (monacoRef.current && jsonModelRef.current) {
      setMonacoJsonMarkers(monacoRef.current, jsonModelRef.current, errors);
    }
  }, [extraJson]);

  // ─── Template insert (one-time) ──────────────────────────────

  const handleTemplateChange = (id: string) => {
    const t = templates.find((t) => t._id === id);
    if (!t) return;
    setHtmlBody(t.htmlBody);
    if (!subject) setSubject(t.subject);
    setActiveTab("html");
    setTemplateId(""); // reset selector immediately
    toast.success(`Template "${t.name}" inserted`);
  };

  // ─── Monaco mount handlers ───────────────────────────────────

  const handleJsonEditorMount = (
    editor: import("monaco-editor").editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) => {
    monacoRef.current = monaco;
    jsonModelRef.current = editor.getModel();

    // Run initial validation
    const { errors } = validateExtraJson(extraJson);
    if (jsonModelRef.current) {
      setMonacoJsonMarkers(monaco, jsonModelRef.current, errors);
    }
  };

  // ─── Preview ─────────────────────────────────────────────────

  const buildPreviews = useCallback(async () => {
    const { errors, isPerRecipient: ipr } = validateExtraJson(extraJson);
    if (errors.length > 0) return toast.error("Fix JSON errors first");

    setPreviewBuilding(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(extraJson);
      } catch {
        return toast.error("Fix JSON first");
      }

      const results: { label: string; html: string; subject: string }[] = [];

      if (ipr && Array.isArray(parsed)) {
        // One preview per unique email — exactly what will be dispatched
        const seen = new Set<string>();
        for (const entry of parsed as Record<string, unknown>[]) {
          const email =
            typeof entry.email === "string" ? entry.email.trim().toLowerCase() : null;
          if (!email || seen.has(email)) continue;
          seen.add(email);

          const ctx = {...TEMPLATE_GLOBALS, extra: entry };
          const renderedSubject = await liquidEngine.parseAndRender(subject, ctx);
          const renderedHtml = await liquidEngine.parseAndRender(htmlBody, ctx);
          results.push({ label: email, html: renderedHtml, subject: renderedSubject });

          if (results.length >= 20) break; // cap at 20 previews
        }
      } else {
        const ctx = {...TEMPLATE_GLOBALS, extra: parsed as Record<string, unknown> };
        const renderedSubject = await liquidEngine.parseAndRender(subject, ctx);
        const renderedHtml = await liquidEngine.parseAndRender(htmlBody, ctx);

        if (recipientEmails.length > 0) {
          // Shared mode still needs one preview per selected recipient.
          for (const email of recipientEmails) {
            results.push({ label: email, html: renderedHtml, subject: renderedSubject });
            if (results.length >= 20) break; // cap at 20 previews
          }
        } else {
          results.push({ label: "Preview", html: renderedHtml, subject: renderedSubject });
        }
      }

      setPreviews(results);
      setPreviewOpen(true);
    } catch (e) {
      toast.error(`Preview failed: ${(e as Error).message}`);
    } finally {
      setPreviewBuilding(false);
    }
  }, [htmlBody, extraJson, recipientEmails, subject]);

  // ─── Save / Send ─────────────────────────────────────────────

  const handleSend = async (andSend = false) => {
    if (!name.trim()) return toast.error("Campaign name is required");
    if (!subject.trim()) return toast.error("Subject is required");
    if (!htmlBody.trim()) return toast.error("HTML body is required");
    if (recipientEmails.length === 0) return toast.error("Add at least one recipient");
    if (jsonErrors.length > 0) return toast.error("Fix JSON errors before sending");

    let parsed: unknown;
    try {
      parsed = JSON.parse(extraJson);
    } catch {
      return toast.error("Invalid JSON");
    }

    setSaving(true);
    try {
      const { data } = await axiosInstance.post("/mailer/campaigns", {
        name,
        subject,
        htmlBody,
        emails: recipientEmails,
        extraJson: parsed,
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

  // ─── Render ───────────────────────────────────────────────────

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: "html", label: "email.html", icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: "json", label: "extra.json", icon: <Braces className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <PreviewSheet open={previewOpen} onOpenChange={setPreviewOpen} previews={previews} />

      <RecipientsDialog
        open={recipientsDialogOpen}
        onOpenChange={setRecipientsDialogOpen}
        contacts={contacts}
        onConfirm={setManualEmails}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-xl">New Campaign</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={buildPreviews}
            disabled={previewBuilding || !htmlBody.trim()}
          >
            {previewBuilding ? (
              <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
            ) : (
              <Eye className="mr-1.5 w-4 h-4" />
            )}
            Show preview
            {recipientCount > 0 && isPerRecipient && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {recipientCount}
              </Badge>
            )}
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
        {/* Campaign name */}
        <Label htmlFor="campaign-name" className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            Name <span className="text-destructive">*</span>
          </span>
          <Input
            id="campaign-name"
            placeholder="Enter your campaign name"
            className="border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Label>

        {/* From */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">From</span>
          <span className="text-sm">NoteHub</span>
        </div>

        {/* To */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            To <span className="text-destructive">*</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecipientsDialogOpen(true)}
            disabled={isPerRecipient}
            title={isPerRecipient ? "Recipients are derived from extra.json" : undefined}
          >
            <Users className="mr-1.5 w-3.5 h-3.5" />
            {isPerRecipient
              ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} (from JSON)`
              : recipientCount > 0
              ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`
              : "Select recipients"}
          </Button>
          {isPerRecipient && (
            <Badge variant="default" className="text-xs">
              driven by extra.json
            </Badge>
          )}
        </div>

        {/* Subject */}
        <Label htmlFor="subject" className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">
            Subject <span className="text-destructive">*</span>
          </span>
          <Input
            id="subject"
            placeholder="Enter your email subject"
            className="border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Label>

        {/* Template — one-time insert */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-20 text-muted-foreground text-sm shrink-0">Template</span>
          <Select value={templateId} onValueChange={handleTemplateChange}>
            <SelectTrigger disabled={loading} className="max-w-72">
              {loading && <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />}
              <SelectValue placeholder="Insert a template…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monaco editor — VS Code tabs */}
        <div className="flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center border-b bg-muted/30 px-1 pt-1 gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-t-sm transition-colors border border-transparent",
                  activeTab === tab.id
                    ? "bg-background border-border border-b-background text-foreground -mb-px"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "json" && jsonErrors.length > 0 && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* HTML editor */}
          <div className={cn("h-100", activeTab !== "html" && "hidden")}>
            <Editor
              height="100%"
              language="html"
              value={htmlBody}
              onChange={(v) => setHtmlBody(v ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 8, bottom: 8 },
                renderLineHighlight: "none",
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { vertical: "auto", horizontal: "auto" },
              }}
            />
          </div>

          {/* JSON editor */}
          <div className={cn("h-100", activeTab !== "json" && "hidden")}>
            <Editor
              height="100%"
              language="json"
              value={extraJson}
              onChange={(v) => setExtraJson(v ?? "{}")}
              onMount={handleJsonEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "off",
                padding: { top: 8, bottom: 8 },
                renderLineHighlight: "none",
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { vertical: "auto", horizontal: "auto" },
              }}
            />
          </div>

          {/* JSON error banner */}
          {activeTab === "json" && jsonErrors.length > 0 && (
            <div className="space-y-1 bg-destructive/5 px-3 py-2 border-t border-destructive/30">
              {jsonErrors.map((e, i) => (
                <p key={i} className="text-destructive text-xs font-mono">
                  ❌ {e.message}
                </p>
              ))}
            </div>
          )}

          {/* JSON mode hint */}
          {activeTab === "json" && jsonErrors.length === 0 && (
            <div className="px-3 py-1.5 border-t bg-muted/20 flex items-center gap-2">
              <Badge
                variant={isPerRecipient ? "default" : "secondary"}
                className="text-xs"
              >
                {isPerRecipient
                  ? `per-recipient · ${recipientCount} unique email${recipientCount !== 1 ? "s" : ""}`
                  : "shared object"}
              </Badge>
              {isPerRecipient && (
                <span className="text-muted-foreground text-xs">
                  Recipients list driven by this JSON
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => handleSend(false)} disabled={saving}>
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