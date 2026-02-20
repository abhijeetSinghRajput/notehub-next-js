"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, LayoutDashboard, Users } from "lucide-react"

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
} from "@/components/ui/sidebar"
import NavUser from "./dashboard/NavUser"

const adminNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "User Management", href: "/admin/user-management", icon: Users },
  { title: "Notification", href: "/admin/notification", icon: Bell },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
