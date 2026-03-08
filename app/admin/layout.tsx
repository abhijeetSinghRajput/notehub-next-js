"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";

import { AdminSidebar } from "@/components/AdminSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ShieldX, Loader2 } from "lucide-react";
import { ModeToggleMini } from "@/components/mode-toggle";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { authUser, isCheckingAuth } = useAuthStore();

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show 401 error if user is not authenticated or not an admin
  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <ShieldX className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive">401</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Authentication required
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You must be an administrator to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky justify-between top-0 z-30 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/75">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <ModeToggleMini />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
