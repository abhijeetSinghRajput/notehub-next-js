"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Send, UserRoundCheck, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem, SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import NavUser from "./dashboard/NavUser";

import LogoText from "@/components/icons/logo/LogoText";
import LogoIcon from "@/components/icons/logo/LogoIcon";

const adminNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
];

const mailerNavItems = [
  { title: "Campaigns", href: "/admin/campaign", icon: Send, },
  { title: "Templates", href: "/admin/template", icon: FileText, },
  { title: "Contacts", href: "/admin/contact", icon: UserRoundCheck, },
]

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
                <LogoIcon className="size-8!" />
                <div className="flex-1 grid text-sm text-left leading-tight">
                  <LogoText className="w-18 text-sm truncate" />
                  <span className="text-muted-foreground text-xs truncate">Admin Panel</span>
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
                    className="px-4 rounded-lg h-10"
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

        <SidebarGroup>
          <SidebarGroupLabel>Mailer</SidebarGroupLabel>
          <SidebarMenu>
            {mailerNavItems.map((item) => {
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
                    className="px-4 rounded-lg h-10"
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
