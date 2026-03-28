"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import NavUser from "./dashboard/NavUser";

import LogoText from "@/components/icons/logo/LogoText";
import LogoIcon from "@/components/icons/logo/LogoIcon";

const adminNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "User Management", href: "/admin/user-management", icon: Users },
  { title: "Notification", href: "/admin/notification", icon: Bell },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // Handler to close sidebar on mobile
  const handleMenuClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin" onClick={handleMenuClick} className="gap-3">
                <div className="bg-white flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LogoIcon size={20} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <LogoText className="truncate text-sm w-18" />
                  <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="h-10 px-4 rounded-lg"
                  >
                    <Link href={item.href} onClick={handleMenuClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
