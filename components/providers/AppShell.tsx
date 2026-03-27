"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";

const NO_SHELL_ROUTES = ["/login", "/signup", "/forgot-password", "/oauth"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const noShell =
    pathname?.startsWith("/admin") ||
    NO_SHELL_ROUTES.some((r) => pathname?.startsWith(r));

  if (noShell) return <>{children}</>;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}