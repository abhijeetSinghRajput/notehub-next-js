"use client";

import TemplateForm from "../_components/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">New Template</h1>
        <p className="text-sm text-muted-foreground">
          Create a reusable Liquid-powered email layout
        </p>
      </div>

      <TemplateForm />
    </div>
  );
}