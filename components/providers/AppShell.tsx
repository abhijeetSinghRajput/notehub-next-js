// components/providers/AppShell.tsx
"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";
import { CollaboratorManagerProvider } from "@/contex/CollaboratorManagerContext";
import dynamic from "next/dynamic";

// ✅ Only the Dialog is lazy — the Provider is imported normally
const CollaboratorsDialog = dynamic(
  () => import("@/components/CollaboratorsDialog").then((m) => m.CollaboratorsDialog),
  { ssr: false }
);

const NO_SHELL_ROUTES = ["/login", "/signup", "/forgot-password", "/oauth"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const noShell =
    pathname?.startsWith("/admin") ||
    NO_SHELL_ROUTES.some((r) => pathname?.startsWith(r));

  if (noShell) return <>{children}</>;

  return (
    // ✅ Provider is a normal import — no ssr:false, doesn't block SSR
    <CollaboratorManagerProvider>
      {/* ✅ Dialog is lazy but isolated — doesn't wrap children */}
      <CollaboratorsDialog />

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          {children}  {/* ✅ SSR unaffected */}
        </SidebarInset>
      </SidebarProvider>
    </CollaboratorManagerProvider>
  );
}