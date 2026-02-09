import {
  Camera,
  CircleUserRound,
  KeyRound,
  PaintbrushVertical,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import React from "react";
import {  useLocation } from "react-router-dom";
import Link from "next/link";



const SettingSidebar = () => {
const { closeSidebar, isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Settings</SidebarGroupLabel>
      <SidebarMenu>
        {settings.map((item) => {
          const isActive =
            location.pathname.split("/").join("") ===
            item.url.split("/").join("");
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                className={isActive && "bg-sidebar-accent"}
              >
                <Link onClick={() => isMobile && closeSidebar()} href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SettingSidebar;
