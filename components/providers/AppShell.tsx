"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

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
