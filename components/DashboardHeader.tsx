"use client";

import { SidebarOpenTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useAuthStore } from "@/app/stores/useAuthStore";
import AddNoteDrawer from "@/components/AddNoteDrawer";
import { SearchButton } from "@/components/SearchButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggleMini } from "@/components/mode-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TooltipWrapper from "@/components/TooltipWrapper";
import GithubIcon from "@/components/icons/githubIcon";
import { useGithubStore } from "@/app/stores/useGithubStore";
import Link from "next/link";
import AppBreadcrumbs from "./AppBreadCrumb";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";


const DashboardHeader = () => {
  const { authUser } = useAuthStore();
  const { open, isMobile } = useSidebar();
  const githubStarCount = useGithubStore((s) => s.starCount);  
  const router = useRouter();

  return (
    <header className="z-50 flex border-b sticky top-0 bg-background  justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="max-w-screen-2xl w-full mx-auto flex justify-between">
        <div className="flex items-center gap-2 px-4 min-w-0 flex-1">
          {!open && authUser && (
            <>
              <TooltipWrapper message={"Open Sidebar Ctrl M"}>
                <SidebarOpenTrigger className="-ml-1 bg-muted/50 size-11 rounded-full border sm:border-none sm:size-8 sm:bg-transparent sm:rounded-md" />
              </TooltipWrapper>
              <Separator orientation="vertical" className="mr-2 h-4" />
            </>
          )}

          <AppBreadcrumbs/>
        </div>

        <div className="shrink-0 mr-4 flex items-center gap-2">
          <SearchButton />

          {!isMobile && (
            <TooltipWrapper message="Source Code">
              <a href="https://github.com/abhijeetSinghRajput/notehub">
                <Button size="sm" className="p-2" variant="secondary">
                  <GithubIcon />
                  {githubStarCount || ""}
                </Button>
              </a>
            </TooltipWrapper>
          )}

          {!authUser ? (
            <div className="flex gap-2">
              <ModeToggleMini className={"size-9"} />
              <Button onClick={() => router.push("/login")}>Login</Button>
            </div>
          ) : (
            <>
              <AddNoteDrawer
                trigger={
                  <Button tooltip="Create Notes" className={`size-8`}
                    aria-label="Add Note Drawer trigger"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />

              <Link
                href={`/${authUser?.userName}`}
                aria-label={`Go to ${authUser?.fullName || "user"} profile`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={authUser?.avatar}
                        alt={authUser?.fullName || "User Profile Photo"}
                      />
                      <AvatarFallback>
                        {(authUser?.fullName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="max-w-64 text-pretty">
                    <div>
                      <p className="text-sm font-medium">
                        {authUser?.fullName}
                      </p>
                      <div className="text-primary-foreground/80 text-xs">
                        <p>{`@${authUser?.userName}`}</p>
                        <p>{authUser?.email}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;