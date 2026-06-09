"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

import { useAuthStore } from "@/app/stores/useAuthStore";
import { SearchButton } from "@/components/SearchButton";
import { ModeToggleMini } from "@/components/mode-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TooltipWrapper from "@/components/TooltipWrapper";
import GithubIcon from "@/components/icons/githubIcon";
import Link from "next/link";
import AppBreadcrumbs from "./AppBreadCrumb";
import { useRouter } from "nextjs-toploader/app";
import AddNoteDialog from "./AddNoteDialog";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import NProgress from "nprogress";

const DashboardHeader = () => {
  const { authUser } = useAuthStore();
  const { open, isMobile, openMobile } = useSidebar();
  const router = useRouter();
  const shouldShowTrigger = isMobile ? !openMobile : !open;

  return (
    <header className="z-50 flex border-b sticky top-0 bg-background  justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="max-w-screen-2xl w-full mx-auto flex justify-between">
        <div className="flex items-center gap-2 px-4 min-w-0 flex-1">
          {shouldShowTrigger && authUser && (
            <>
              <TooltipWrapper message={"Ctrl + B"}>
                <SidebarTrigger className="-ml-1 bg-muted/50 size-11 rounded-full border sm:border-none sm:size-8 sm:bg-transparent sm:rounded-md" />
              </TooltipWrapper>
              <Separator orientation="vertical" className="mr-2 h-4" />
            </>
          )}

          <AppBreadcrumbs />
        </div>

        <div className="shrink-0 mr-4 flex items-center gap-2">
          <SearchButton />
          {!authUser ? (
            <div className="flex gap-2">
              <ModeToggleMini className={"size-9"} />
              <TooltipWrapper message="Settings">
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2"
                  onClick={() => router.push("/settings/appearance")}
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <Button
                onClick={() => {
                  NProgress.start();
                  router.push("/login");
                }}
              >
                Login
              </Button>
            </div>
          ) : (
            <>
              <AddNoteDialog
                trigger={
                  <Button
                    tooltip="Create Notes"
                    className={`size-8`}
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
                    <div className="relative size-8 shrink-0 rounded-full overflow-hidden">
                      <CloudinaryImage
                        src={authUser?.avatar || "/avatar.svg"}
                        alt={authUser?.fullName || "User"}
                        fill
                        sizes="32px"
                        className="object-cover"
                        loading="eager"
                        fetchPriority="low"
                      />
                    </div>
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
