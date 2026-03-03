"use client";

import {
  LogIn,
  FolderPlus,
  PenLine,
  UserPlus2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const onboardingSteps = [
  {
    id: "login",
    icon: LogIn,
    title: "Login to your account",
    description: "Sign in to start creating and saving your notes.",
    href: "/login",
  },
  {
    id: "collection",
    icon: FolderPlus,
    title: "Create a collection",
    description: "Organize notes by subject, topic, or project.",
  },
  {
    id: "note",
    icon: PenLine,
    title: "Create your first note",
    description: "Start writing and build your digital knowledge base.",
  },
  {
    id: "collaborate",
    icon: UserPlus2,
    title: "Invite a collaborator",
    description:
      "Share your private collection with teammates and work together seamlessly.",
  },
];

export default function OnboardingCard() {
  return (
    <Card className="rounded-2xl w-full shadow-md">
      <CardHeader>
        <h2 className="text-xl font-semibold">Welcome to NoteHub</h2>
        <p className="text-sm text-muted-foreground">
          Get started in just a few steps.
        </p>
      </CardHeader>

      <div className="border-t" />

      <CardContent className="p-0">
        {onboardingSteps.map((step) => {
          const Icon = step.icon;
          const className = "group flex items-start gap-4 px-6 py-4 hover:bg-muted/40 transition-colors";

          return step.href ? (
            <Link
              key={step.id}
              href={step.href}
              className={className}
            >
              <Icon className="size-5 min-w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
            </Link>
          ) : (
            <div
              key={step.id}
              className={className}
            >
              <Icon className="size-5 min-w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
