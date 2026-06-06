"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import TemplateForm, { TemplateFormValues } from "../_components/TemplateForm";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<TemplateFormValues | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data } = await axiosInstance.get(`/mailer/templates/${id}`);
        const { template } = data;
        setInitialValues({
          name: template?.name,
          subject: template?.subject,
          htmlBody: template?.htmlBody,
          previewText: template?.previewText,
          mode: template.mode ?? "shared",
        });
      } catch (e) {
        toast.error("Failed to load template");
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div>
        <h1 className="font-semibold text-xl">Edit Template</h1>
        <p className="text-muted-foreground text-sm">
          Update your Liquid-powered email layout
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <TemplateForm initialValues={initialValues} templateId={id} />
      )}
    </div>
  );
}