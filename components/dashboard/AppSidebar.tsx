"use client";

import React, { useEffect, useState, useRef } from "react";
import { CopyMinus, Search, Settings, X } from "lucide-react";

import NavMain from "@/components/dashboard/NavMain";
import NavUser from "@/components/dashboard/NavUser";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SidebarSearch } from "./SidebarSearch";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { ModeToggleMini } from "@/components/mode-toggle";
import LogoIcon from "../icons/LogoIcon";
import Logo from "../Logo";

const AppSidebar = (props: React.ComponentProps<typeof Sidebar>) => {
  const { getAllCollections, collections } = useNoteStore();
  const { authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { collapseAll } = useLocalStorage();
  const { setOpen, isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (!authUser?._id) return;
    // Fetch collections when user becomes available
    void getAllCollections({
      userId: String(authUser._id),
    });
  }, [getAllCollections, authUser?._id]);

  // Also refetch if collections array is empty but user exists
  useEffect(() => {
    if (authUser?._id && collections.length === 0) {
      const timer = setTimeout(() => {
        void getAllCollections({
          userId: String(authUser._id),
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authUser?._id, collections.length, getAllCollections]);

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
  };

  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  if (!authUser) return null;

  return (
    <Sidebar {...props}>
      <SidebarHeader className="py-2 px-4 h-16 justify-center">
        {showSearch ? (
          <div className="flex gap-2 items-center">
            <SidebarSearch inputRef={searchRef} onSearch={setSearchQuery} />
            <Button
              tooltip="Close Searchbar"
              variant="ghost"
              className="size-8"
              onClick={handleCloseSearch}
              aria-label="close searchbar"
            >
              <X />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <SidebarTrigger
                tooltip={"Ctrl + B"}
                aria-label="close sidebar"
                className="bg-muted/50 size-11 rounded-full border sm:border-none sm:size-8 sm:bg-transparent sm:rounded-md"
              />
              <Link
                onClick={() => isMobile && setOpenMobile(false)}
                href="/"
                className="truncate font flex gap-2 items-center"
              >
                <Logo size={12}/>
              </Link>
            </div>

            <div className="flex buttons-container gap-1">
              <Button
                asChild
                tooltip="Settings"
                className="size-8 text-sidebar-accent-foreground/70"
                variant="ghost"
                aria-label="go to settings"
              >
                <Link href="/settings"
                onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Settings />
                </Link>
              </Button>
              <Button
                tooltip="Collapse All"
                className="size-8 text-sidebar-accent-foreground/70"
                variant="ghost"
                onClick={collapseAll}
                aria-label="collapse all folder"
              >
                <CopyMinus />
              </Button>
              <ModeToggleMini
                variant="ghost"
                className={"text-accent-foreground/70"}
              />
              <Button
                tooltip="Search Notes"
                className="size-8 text-sidebar-accent-foreground/70"
                variant="ghost"
                onClick={() => {
                  setShowSearch(true);
                }}
                aria-label="search notes"
              >
                <Search />
              </Button>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <MemoizedNavMain collections={collections} searchQuery={searchQuery} />
      </SidebarContent>

      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

const MemoizedNavMain = React.memo(NavMain);

export default AppSidebar;
