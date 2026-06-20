"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "nextjs-toploader/app";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Liquid } from "liquidjs";
import { TEMPLATE_GLOBALS } from "@/lib/mailer-globals";
import { Label } from "@/components/ui/label";
import { generateAndUploadPreview } from "@/lib/mailer-preview";
import { TabbedCodeEditor, EditorTab } from "./tabbed-code-editor";
import PreviewSheet from "../../campaign/_components/preview-sheet";

const liquidEngine = new Liquid({
  strictFilters: false,
  strictVariables: false,
});

// Sample user injected into TEMPLATE_GLOBALS context for preview rendering
const SAMPLE_USER = {
  fullName: "Rahul Sharma",
  userName: "rahul-sharma",
  email: "rahul@example.com",
  bio: "Full stack developer",
  skills: ["React", "Node.js"],
};

export interface TemplateFormValues {
  name: string;
  subject: string;
  htmlBody: string;
  previewText: string;
  mode: "shared" | "per_recipient";
}

export const emptyForm: TemplateFormValues = {
  name: "",
  subject: "",
  htmlBody: "",
  previewText: "",
  mode: "shared",
};

interface Props {
  initialValues?: TemplateFormValues;
  templateId?: string;
}

export default function TemplateForm({ initialValues, templateId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateFormValues>(
    initialValues ?? emptyForm,
  );
  const [sampleJson, setSampleJson] = useState("{}");
  const [activeTab, setActiveTab] = useState<EditorTab>("html");

  // Preview sheet
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState<
    { email: string; html: string; subject: string; previewText: string }[]
  >([]);
  const [previewBuilding, setPreviewBuilding] = useState(false);

  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(templateId);

  useEffect(() => {
    if (initialValues) setForm(initialValues);
  }, [initialValues]);

  // ─── Build previews (same pattern as campaign) ───────────────────────────────

  const buildPreviews = useCallback(async () => {
    if (!form.htmlBody.trim()) return;

    setPreviewBuilding(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(sampleJson);
      } catch {
        return toast.error("Fix JSON first");
      }

      const results: {
        email: string;
        html: string;
        subject: string;
        previewText: string;
      }[] = [];

      if (Array.isArray(parsed)) {
        // Per-recipient: render once per unique entry (cap at 20)
        const seen = new Set<string>();
        for (const entry of parsed as Record<string, unknown>[]) {
          const email =
            typeof entry.email === "string"
              ? entry.email.trim().toLowerCase()
              : `Entry ${results.length + 1}`;

          if (email) {
            if (seen.has(email)) continue;
            seen.add(email);
          }

          const ctx = {
            ...TEMPLATE_GLOBALS,
            user: SAMPLE_USER,
            extra: entry,
            unsubscribe_url: "[unsubscribe_url]",
          };
          const renderedSubject = await liquidEngine.parseAndRender(
            form.subject,
            ctx,
          );
          const renderedHtml = await liquidEngine.parseAndRender(
            form.htmlBody,
            ctx,
          );
          const renderedPreviewText = await liquidEngine.parseAndRender(
            form.previewText,
            ctx,
          );
          results.push({
            email,
            html: renderedHtml,
            subject: renderedSubject,
            previewText: renderedPreviewText,
          });

          if (results.length >= 20) break;
        }
      } else {
        // Shared: single render using the whole parsed object as extra
        const ctx = {
          ...TEMPLATE_GLOBALS,
          user: SAMPLE_USER,
          extra: parsed as Record<string, unknown>,
          unsubscribe_url: "[unsubscribe_url]",
        };
        const renderedSubject = await liquidEngine.parseAndRender(
          form.subject,
          ctx,
        );
        const renderedHtml = await liquidEngine.parseAndRender(
          form.htmlBody,
          ctx,
        );
        const renderedPreviewText = await liquidEngine.parseAndRender(
          form.previewText,
          ctx,
        );
        results.push({
          email: form.name || "Preview",
          html: renderedHtml,
          subject: renderedSubject,
          previewText: renderedPreviewText,
        });
      }

      setPreviews(results);
      setPreviewOpen(true);
    } catch (e) {
      toast.error(`Preview failed: ${(e as Error).message}`);
    } finally {
      setPreviewBuilding(false);
    }
  }, [form, sampleJson]);

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim()) {
      return toast.error("Name, subject and body are required");
    }
    setSaving(true);
    try {
      let savedId: string;
      if (isEditing) {
        await axiosInstance.put(`/mailer/templates/${templateId}`, form);
        savedId = templateId!;
        toast.success("Template updated");
      } else {
        const { data } = await axiosInstance.post("/mailer/templates", form);
        savedId = data.template._id;
        toast.success("Template created");
      }
      const previewCtx = {
        ...TEMPLATE_GLOBALS,
        user: SAMPLE_USER,
        extra: JSON.parse(sampleJson || "{}"),
        unsubscribe_url: "[unsubscribe_url]",
      };
      const renderedHtml = await liquidEngine.parseAndRender(
        form.htmlBody,
        previewCtx,
      );
      generateAndUploadPreview(savedId, renderedHtml).catch(() =>
        console.warn("Preview generation failed silently"),
      );
      router.push("/admin/template");
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previews={previews}
      />

      <div className="space-y-4">
        {/* ── Metadata fields ─────────────────────────────────────────────── */}
        <div className="bg-background mt-4 border rounded-lg divide-y">
          <Label
            htmlFor="template-name"
            className="flex items-center gap-2 px-4 py-3"
          >
            <span className="w-24 text-muted-foreground text-sm shrink-0">
              Name <span className="text-destructive">*</span>
            </span>
            <Input
              id="template-name"
              placeholder="Template name"
              className="border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Label>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="border-r divide-y sm:divide-none">
              <Label
                htmlFor="subject"
                className="flex items-center gap-2 px-4 py-3"
              >
                <span className="w-24 text-muted-foreground text-sm shrink-0">
                  Subject <span className="text-destructive">*</span>
                </span>
                <Input
                  id="subject"
                  className="border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
                  placeholder="Enter your email subject"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                />
              </Label>

              <Label
                htmlFor="previewText"
                className="flex items-center gap-2 px-4 py-3"
              >
                <span className="w-24 text-muted-foreground text-sm shrink-0">
                  Preview Text <span className="text-destructive">*</span>
                </span>
                <Input
                  id="previewText"
                  className="border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
                  placeholder="Preview text (shown in inbox)"
                  value={form.previewText}
                  onChange={(e) =>
                    setForm({ ...form, previewText: e.target.value })
                  }
                />
              </Label>
            </div>

            {/* Inbox preview card */}
            {form.subject && form.previewText && (
              <div className="flex gap-4 p-4 pt-6 bg-card w-full">
                <div className="size-12 font-medium shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  N
                </div>
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">Notehub</p>
                    <span className="text-muted-foreground text-sm">
                      Just now
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{form.subject}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {form.previewText}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mode */}
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="w-24 text-muted-foreground text-sm shrink-0">
              Mode <span className="text-destructive">*</span>
            </span>
            <Select
              value={form.mode}
              onValueChange={(v) =>
                setForm({ ...form, mode: v as "shared" | "per_recipient" })
              }
            >
              <SelectTrigger>
                <SelectValue className="min-w-40" />
              </SelectTrigger>
              <SelectContent className="min-w-40">
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="per_recipient">Per recipient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Tabbed editor ────────────────────────────────────────────────── */}
        <TabbedCodeEditor
          activeTab={activeTab}
          onTabChange={setActiveTab}
          htmlBody={form.htmlBody}
          onHtmlChange={(val) => setForm({ ...form, htmlBody: val })}
          extraJson={sampleJson}
          onJsonChange={setSampleJson}
          previewButton={{
            loading: previewBuilding,
            disabled: !form.htmlBody.trim(),
            onClick: buildPreviews,
          }}
          statusBar={(tab) => {
            if (tab !== "json") return null;
            return (
              <div className="px-3 py-1.5 border-t bg-muted/20">
                <p className="text-muted-foreground text-xs font-mono">
                  Sample data for Liquid preview — not sent with the template
                </p>
              </div>
            );
          }}
        />
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2 bg-background py-3 border-t sticky bottom-0">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/template")}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {isEditing ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </>
  );
}
