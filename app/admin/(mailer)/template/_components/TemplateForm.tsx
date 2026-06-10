"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Liquid } from "liquidjs";
import dynamic from "next/dynamic";
import { TEMPLATE_GLOBALS } from "@/lib/mailer-globals";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generateAndUploadPreview } from "@/lib/mailer-preview";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 bg-muted rounded-md">
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
  ),
});

const liquidEngine = new Liquid({
  strictFilters: false,
  strictVariables: false,
});

const SAMPLE_SHARED = {
  user: {
    fullName: "Rahul Sharma",
    userName: "rahul-sharma",
    email: "rahul@example.com",
    bio: "Full stack developer",
    skills: ["React", "Node.js"],
  },
  extra: {},
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
  templateId?: string; // present → update, absent → create
}

export default function TemplateForm({ initialValues, templateId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateFormValues>(
    initialValues ?? emptyForm,
  );
  const [sampleJson, setSampleJson] = useState("{}");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<unknown>(null);

  const isEditing = Boolean(templateId);

  // Sync if initialValues arrive after mount (e.g. async fetch in edit page)
  useEffect(() => {
    if (initialValues) setForm(initialValues);
  }, [initialValues]);

  // Live Liquid preview
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!form.htmlBody) {
        setPreviewHtml("");
        return;
      }
      setPreviewLoading(true);
      try {
        let extra: unknown = {};
        try {
          extra = JSON.parse(sampleJson);
        } catch {}

        const ctx =
          form.mode === "per_recipient" && Array.isArray(extra)
            ? {
                ...TEMPLATE_GLOBALS,
                user: SAMPLE_SHARED.user,
                extra: (extra as Record<string, unknown>[])[0] ?? {},
                unsubscribe_url: "[unsubscribe_url]",
              }
            : {
                ...TEMPLATE_GLOBALS,
                user: SAMPLE_SHARED.user,
                extra,
                unsubscribe_url: "[unsubscribe_url]",
              };

        const html = await liquidEngine.parseAndRender(form.htmlBody, ctx);
        if (!cancelled) setPreviewHtml(html);
      } catch (e) {
        if (!cancelled)
          setPreviewHtml(`<pre style="color:red;padding:16px">${e}</pre>`);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.htmlBody, form.mode, sampleJson]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim()) {
      return toast.error("Name, subject and body are required");
    }
    setSaving(true);
    try {
      let savedId: string;

      if (isEditing) {
        await axiosInstance.put(`/mailer/templates/${templateId}`, form);
        savedId = templateId;
        toast.success("Template updated");
      } else {
        const { data } = await axiosInstance.post("/mailer/templates", form);
        savedId = data.template._id; // adjust key if your API returns differently
        toast.success("Template created");
      }

      // Fire-and-forget — won't block navigation
      generateAndUploadPreview(savedId, form.htmlBody).catch(() =>
        console.warn("Preview generation failed silently"),
      );

      router.push("/admin/template");
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const samplePlaceholder =
    form.mode === "per_recipient"
      ? `[\n  {\n    "userId": "abc123",\n    "blogs": []\n  }\n]`
      : `{\n  "couponCode": "NH50"\n}`;

  return (
    <>
      <div className="space-y-4">
        <div className="bg-background mt-4 border rounded-lg divide-y">
          {/* Template name */}
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
              {/* Subject */}
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

              {/* Preview Text */}
              <Label
                htmlFor="subject"
                className="flex items-center gap-2 px-4 py-3"
              >
                <span className="w-24 text-muted-foreground text-sm shrink-0">
                  Preview Text <span className="text-destructive">*</span>
                </span>
                <Input
                  id="subject"
                  className="border-none font-normal shadow-none bg-transparent! focus-visible:ring-0"
                  placeholder="Preview text (shown in inbox)"
                  value={form.previewText}
                  onChange={(e) =>
                    setForm({ ...form, previewText: e.target.value })
                  }
                />
              </Label>
            </div>
            {form.subject && form.previewText && (
              <>
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
                    <p className="text-sm font-medium truncate">
                      {form.subject}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {form.previewText}
                    </p>
                  </div>
                </div>
              </>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">
                  Shared — same extra for all
                </SelectItem>
                <SelectItem value="per_recipient">
                  Per recipient — array with emails
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Editor / Preview tabs */}
        <Tabs defaultValue="editor">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">
              Preview
              {previewLoading && (
                <Loader2 className="w-3 h-3 ml-1 animate-spin" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-2">
            <div className="border rounded-md overflow-hidden">
              <MonacoEditor
                height="380px"
                language="html"
                value={form.htmlBody}
                onChange={(val) => setForm({ ...form, htmlBody: val ?? "" })}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                }}
                theme="vs-dark"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Sample extra JSON for preview
                {form.mode === "per_recipient" && (
                  <span className="ml-1 text-amber-500">
                    — array mode, first entry used for preview
                  </span>
                )}
              </p>
              <Textarea
                value={sampleJson}
                placeholder={samplePlaceholder}
                onChange={(e) => setSampleJson(e.target.value)}
                className="font-mono text-xs min-h-20 resize-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-md overflow-hidden h-100">
              {previewLoading ? (
                <div className="flex items-center justify-center h-72">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-100 border"
                  title="Email preview"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Actions */}
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
