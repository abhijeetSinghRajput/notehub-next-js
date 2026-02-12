"use client";

import React, { useState } from "react";
import { Bell, ChevronsUpDown, Loader2, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/app/stores/useAuthStore";
import BadgeIcon from "../icons/BadgeIcon";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NavUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();
  const { authUser, logout, isLoggingOut } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setOpenMobile(false); // Changed from closeSidebar()
    const layers = document.querySelectorAll("[data-scroll-locked]");
    if (layers.length === 0) {
      document.body.style.pointerEvents = "";
    }
    router.replace("/");
  };
  

  if(!authUser) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={authUser?.avatar}
                  alt={authUser?.fullName || "User Profile Photo"}
                />
                <AvatarFallback className="rounded-lg">
                  {authUser?.fullName
                    ? authUser.fullName
                        .trim()
                        .split(/\s+/)
                        .map((w) => w[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)
                    : "NH"}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex gap-1.5 items-center">
                  <span className="truncate font-semibold">
                    {authUser?.fullName}
                  </span>
                  {authUser.role === "admin" && (
                    <BadgeIcon className="size-[14px] text-blue-500" />
                  )}
                </div>
                <span className="truncate text-xs">{authUser?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side={"bottom"}
            sideOffset={10}
          >
            <Link href={`/${authUser?.userName}`}>
              <DropdownMenuItem
                onClick={() => isMobile && setOpenMobile(false)}
                className="h-auto!"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={authUser?.avatar}
                    alt={authUser?.fullName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {authUser?.fullName
                      ? authUser.fullName
                          .trim()
                          .split(/\s+/)
                          .map((w) => w[0]?.toUpperCase())
                          .join("")
                          .slice(0, 2)
                      : "NH"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex gap-1.5 items-center">
                    <span className="truncate font-semibold">
                      {authUser?.fullName}
                    </span>
                    {authUser.role === "admin" && (
                      <BadgeIcon className="size-[14px] text-blue-500" />
                    )}
                  </div>
                  <span className="truncate text-xs">{authUser?.email}</span>
                </div>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="bg-primary/10 my-2" />

            <DropdownMenuGroup>
              <Link
                href="/settings/appearance"
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
              {isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default NavUser;
