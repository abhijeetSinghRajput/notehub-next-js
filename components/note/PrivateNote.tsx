"use client";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/stores/useAuthStore";

export default function PrivateNote() {
  const router = useRouter();
  const { authUser } = useAuthStore();

  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-4">
      <div className="bg-secondary p-6 rounded-full">
        <Lock className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">This note is private</h2>
      <p className="text-muted-foreground max-w-md text-center">
        The owner of this note has set it to private. You need permission to view
        it.
      </p>
      <Button onClick={() => router.push(authUser ? "/" : "/login")}>
        {authUser ? "Browse your notes" : "Sign in to view your notes"}
      </Button>
    </div>
  );
}
