"use client";

import { useState } from "react";
import { Lightbulb, FileText, Upload, Flag, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const writingTips = [
  {
    icon: Lightbulb,
    title: "Hook them in the first 2 lines",
    description:
      "Start with a question, bold statement, or surprising idea that makes readers curious.",
  },
  {
    icon: FileText,
    title: "Add depth with real examples",
    description:
      "Use personal experiences or real-world scenarios to make your content relatable.",
  },
  {
    icon: Upload,
    title: "Upload your pending draft",
    description:
      "Even a rough version is better than nothing. Publish now, refine later.",
  },
  {
    icon: Flag,
    title: "End with a strong conclusion",
    description: "Leave readers with a clear takeaway or call-to-action.",
  },
];

interface WritingTipsCardProps {
  defaultOpen?: boolean;
  className?: string;
}

export default function WritingTipsCard({
  defaultOpen = true,
  className,
}: WritingTipsCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("rounded-2xl w-full shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Writing Tips to Stand Out</h2>
          <p className="text-sm text-muted-foreground">
            Improve the quality of your notes.
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <Minus /> : <Plus />}
        </Button>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all border-t duration-500 ease-in-out ${
          open ? "max-h-150 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="p-0">
          {writingTips.map((tip, index) => {
            const Icon = tip.icon;

            return (
              <div
                key={index}
                className="flex items-start gap-4 px-6 py-4"
              >
                <Icon className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </div>
    </Card>
  );
}
