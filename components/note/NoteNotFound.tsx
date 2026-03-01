"use client";

import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import Link from "next/link";

export default function NoteNotFound() {
  return (
    <div className="w-full h-full flex mt-40 justify-center">
      <div className="flex flex-col items-center text-center max-w-md space-y-4">
        <div className="size-20 bg-muted rounded-full flex items-center justify-center">
          <Inbox className="size-12 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Note Not Found</h3>
          <p className="text-muted-foreground">
            We couldn&apos;t find this note. It may have been deleted or moved.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/">Explore Notes</Link>
        </Button>
      </div>
    </div>
  );
}
