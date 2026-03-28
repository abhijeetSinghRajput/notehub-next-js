// components/providers/AppShell.tsx
"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";
import dynamic from "next/dynamic";

const CollaboratorManagerProvider = dynamic(
  () =>
    import("@/contex/CollaboratorManagerContext").then(
      (m) => m.CollaboratorManagerProvider
    ),
  { ssr: false }
);

const CollaboratorsDialog = dynamic(
  () =>
    import("@/components/CollaboratorsDialog").then(
      (m) => m.CollaboratorsDialog
    ),
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
    <CollaboratorManagerProvider>
      <CollaboratorsDialog />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </CollaboratorManagerProvider>
  );
}