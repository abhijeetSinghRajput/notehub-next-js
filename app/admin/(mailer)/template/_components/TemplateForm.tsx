"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 bg-muted rounded-md">
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
  ),
});

const liquidEngine = new Liquid({ strictFilters: false, strictVariables: false });

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
    initialValues ?? emptyForm
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
                user: SAMPLE_SHARED.user,
                extra: (extra as Record<string, unknown>[])[0] ?? {},
              }
            : { user: SAMPLE_SHARED.user, extra };

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
      if (isEditing) {
        await axiosInstance.put(`/mailer/templates/${templateId}`, form);
        toast.success("Template updated");
      } else {
        await axiosInstance.post("/mailer/templates", form);
        toast.success("Template created");
      }
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
    <div className="space-y-4">
      {/* Row 1: name / preview text / mode */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          placeholder="Template name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Preview text (shown in inbox)"
          value={form.previewText}
          onChange={(e) => setForm({ ...form, previewText: e.target.value })}
        />
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
            <SelectItem value="shared">Shared — same extra for all</SelectItem>
            <SelectItem value="per_recipient">
              Per recipient — array with userId
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <Input
        placeholder="Subject — supports Liquid: Hey {{ user.fullName }}!"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />

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
          <div className="border rounded-md overflow-hidden min-h-72">
            {previewLoading ? (
              <div className="flex items-center justify-center h-72">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-72 border-0"
                title="Email preview"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2">
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
    </div>
  );
}