"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Loader2, Send, Eye, Users, Save } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { Liquid } from "liquidjs";
import PreviewSheet from "../_components/preview-sheet";
import RecipientsDialog from "../_components/recipients-dialog";
import { TEMPLATE_GLOBALS } from "@/lib/mailer-globals";
import { Contact, Template } from "@/types/mailer.types";

import {
  CampaignCodeEditor,
  validateExtraJson,
  type JsonError,
} from "../_components/campaign-code-editor";
import { EditorTab } from "../../template/_components/tabbed-code-editor";
import { cn } from "@/lib/utils";

const liquidEngine = new Liquid({
  strictFilters: false,
  strictVariables: false,
});

// ─── Main Page ────────────────────────────────────────────────

interface CampaignEditorProps {
  campaignId?: string; // present = edit mode, absent = new
}

export default function CampaignEditor({ campaignId }: CampaignEditorProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isEditMode = !!campaignId;

  // editor state
  const [activeTab, setActiveTab] = useState<EditorTab>("html");
  const [htmlBody, setHtmlBody] = useState("<p>Hello {{ extra.name }},</p>\n");
  const [extraJson, setExtraJson] = useState("{}");
  const [jsonErrors, setJsonErrors] = useState<JsonError[]>([]);
  const [isPerRecipient, setIsPerRecipient] = useState(false);

  // preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState<
    { label: string; html: string; subject: string }[]
  >([]);
  const [previewBuilding, setPreviewBuilding] = useState(false);

  // recipients (manual select — disabled when per-recipient extraJson is active)
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [manualEmails, setManualEmails] = useState<string[]>([]);

  // form
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
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
                typeof e.email === "string"
                  ? e.email.trim().toLowerCase()
                  : null,
              )
              .filter(Boolean) as string[],
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
        const requests = [
          axiosInstance.get("/mailer/templates"),
          axiosInstance.get("/mailer/contacts"),
        ];
        if (isEditMode) {
          requests.push(axiosInstance.get(`/mailer/campaigns/${campaignId}`));
        }
        const results = await Promise.all(requests);
        setTemplates(results[0].data.templates);
        setContacts(results[1].data.contacts);

        if (isEditMode) {
          const c = results[2].data.campaign;
          setName(c.name);
          setSubject(c.subject);
          setPreviewText(c.previewText || "");
          setHtmlBody(c.htmlBody);
          setExtraJson(JSON.stringify(c.extraJson ?? {}, null, 2));
          setManualEmails(c.emails ?? []);
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaignId]);

  // ─── JSON validation effect ──────────────────────────────────

  useEffect(() => {
    const { errors, isPerRecipient: ipr } = validateExtraJson(extraJson);
    setJsonErrors(errors);
    setIsPerRecipient(ipr);
  }, [extraJson]);

  // ─── Template insert (one-time) ──────────────────────────────

  const handleTemplateChange = async (id: string) => {
    const t = templates.find((t) => t._id === id);
    if (!t) return;

    try {
      const { data } = await axiosInstance.get(`/mailer/templates/${id}`);
      const full = data.template;
      setHtmlBody(full.htmlBody);
      setSubject(full.subject);
      setPreviewText(full.previewText || "");
      setActiveTab("html");
      setTemplateId("");
      toast.success(`Template "${full.name}" inserted`);
    } catch {
      toast.error("Failed to load template");
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
        const seen = new Set<string>();
        for (const entry of parsed as Record<string, unknown>[]) {
          const email =
            typeof entry.email === "string"
              ? entry.email.trim().toLowerCase()
              : null;
          if (!email || seen.has(email)) continue;
          seen.add(email);

          const ctx = { ...TEMPLATE_GLOBALS, extra: entry };
          const renderedSubject = await liquidEngine.parseAndRender(
            subject,
            ctx,
          );
          const renderedHtml = await liquidEngine.parseAndRender(htmlBody, ctx);
          results.push({
            label: email,
            html: renderedHtml,
            subject: renderedSubject,
          });

          if (results.length >= 20) break;
        }
      } else {
        const ctx = {
          ...TEMPLATE_GLOBALS,
          extra: parsed as Record<string, unknown>,
        };
        const renderedSubject = await liquidEngine.parseAndRender(subject, ctx);
        const renderedHtml = await liquidEngine.parseAndRender(htmlBody, ctx);

        if (recipientEmails.length > 0) {
          for (const email of recipientEmails) {
            results.push({
              label: email,
              html: renderedHtml,
              subject: renderedSubject,
            });
            if (results.length >= 20) break;
          }
        } else {
          results.push({
            label: "Preview",
            html: renderedHtml,
            subject: renderedSubject,
          });
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
      const payload = {
        name,
        subject,
        previewText,
        htmlBody,
        emails: recipientEmails,
        extraJson: parsed,
      };

      let campaignIdToUse = campaignId;

      if (isEditMode) {
        await axiosInstance.put(`/mailer/campaigns/${campaignId}`, payload);
        toast.success("Campaign updated");
      } else {
        const { data } = await axiosInstance.post("/mailer/campaigns", payload);
        campaignIdToUse = data.campaign._id;
        toast.success("Saved as draft");
      }

      if (andSend) {
        await axiosInstance.post(`/mailer/campaigns/${campaignIdToUse}/send`);
        toast.success("Campaign dispatched");
      }

      router.push("/admin/campaign");
    } catch {
      toast.error(
        isEditMode ? "Failed to update campaign" : "Failed to create campaign",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <PreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previews={previews}
      />

      <RecipientsDialog
        open={recipientsDialogOpen}
        onOpenChange={setRecipientsDialogOpen}
        contacts={contacts}
        onConfirm={setManualEmails}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-xl">
          {isEditMode ? "Edit Campaign" : "New Campaign"}
        </h1>
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
        </div>
      </div>

      {/* Compose card */}
      <div className="bg-background mt-4 border rounded-lg divide-y">
        {/* Campaign name */}
        <Label
          htmlFor="campaign-name"
          className="flex items-center gap-4 px-4 py-3"
        >
          <span className="w-24 text-muted-foreground text-sm shrink-0">
            Name <span className="text-destructive">*</span>
          </span>
          <Input
            id="campaign-name"
            placeholder="Enter your campaign name"
            className="pl-0 border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Label>

        {/* From */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-24 text-muted-foreground text-sm shrink-0">
            From
          </span>
          <span className="text-sm">NoteHub</span>
        </div>

        {/* To */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-24 text-muted-foreground text-sm shrink-0">
            To <span className="text-destructive">*</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecipientsDialogOpen(true)}
            disabled={isPerRecipient}
            title={
              isPerRecipient
                ? "Recipients are derived from extra.json"
                : undefined
            }
          >
            <Users className="mr-1.5 w-3.5 h-3.5" />
            {isPerRecipient
              ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} (from JSON)`
              : recipientCount > 0
                ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`
                : "Select recipients"}
          </Button>
        </div>

        {/* Subject */}
        <Label htmlFor="subject" className="flex items-center gap-4 px-4 py-3">
          <span className="w-24 text-muted-foreground text-sm shrink-0">
            Subject <span className="text-destructive">*</span>
          </span>
          <Input
            id="subject"
            placeholder="Enter your email subject"
            className="pl-0 border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Label>

        {/* Preview Text */}
        <Label
          htmlFor="previewText"
          className="flex items-center gap-4 px-4 py-3"
        >
          <span className="w-24 text-muted-foreground text-sm shrink-0">
            Preview Text
          </span>
          <Input
            id="previewText"
            placeholder="Short summary shown in inbox"
            className="pl-0 border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
          />
        </Label>

        {/* Template — one-time insert */}
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-24 text-muted-foreground text-sm shrink-0">
            Template
          </span>
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

        {/* ── Code Editor ──────────────────────────────────────── */}
        <CampaignCodeEditor
          activeTab={activeTab}
          onTabChange={setActiveTab}
          htmlBody={htmlBody}
          onHtmlChange={setHtmlBody}
          extraJson={extraJson}
          onJsonChange={setExtraJson}
          jsonErrors={jsonErrors}
          isPerRecipient={isPerRecipient}
          recipientCount={recipientCount}
          previewBuilding={previewBuilding}
          onPreview={buildPreviews}
        />
      </div>

      {/* Bottom actions */}
      <div className={cn("flex justify-between items-center py-2 sticky bottom-0 bg-background z-50", isEditMode && "flex-row-reverse")}>
        <Button
          variant={isEditMode ? "default" : "outline"}
          onClick={() => handleSend(false)}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 w-4 h-4" />
          )}
          {isEditMode ? "Update draft" : "Save as draft"}
        </Button>
        <Button 
          variant={isEditMode ? "outline" : "default"}
        onClick={() => handleSend(true)} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 w-4 h-4" />
          )}
          Send emails
        </Button>
      </div>
    </div>
  );
}
