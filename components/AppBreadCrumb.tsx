"use client";

import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RouteItem {
  name: string;
  path: string;
}

export default function AppBreadcrumbs() {
  const pathname = usePathname();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [visibleBreadcrumbs, setVisibleBreadcrumbs] = useState(3);
  const [visible, setVisible] = useState<RouteItem[]>([]);
  const [hidden, setHidden] = useState<RouteItem[]>([]);

  // --- Calculate visibleBreadcrumbs based on viewport width ---
  useEffect(() => {
    const updateVisible = () => {
      const width = window.innerWidth;
      if (width >= 1536) setVisibleBreadcrumbs(5); // 2xl
      else if (width >= 1280) setVisibleBreadcrumbs(4); // xl
      else if (width >= 1024) setVisibleBreadcrumbs(3); // lg
      else if (width >= 768) setVisibleBreadcrumbs(2); // md
      else setVisibleBreadcrumbs(1); // sm
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  // --- Generate route items from pathname ---
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const tempRoutes: RouteItem[] = [{ name: "NoteHub", path: "/" }];
    let path = "/";

    segments.forEach((segment, index) => {
      path += `${segment}/`;
      // Customize display names if needed
      let name = segment;
      if (segment === "note" && segments[index + 1]) {
        const noteId = segments[index + 1];
        name = `Note ${noteId}`; // or fetch note title dynamically
        path += `${noteId}/`;
      }
      tempRoutes.push({ name, path });
    });

    setRoutes(tempRoutes);
  }, [pathname]);

  // --- Calculate visible / hidden breadcrumbs ---
  useEffect(() => {
    if (routes.length === 0) return;

    const total = routes.length;

    if (total <= visibleBreadcrumbs) {
      setVisible(routes);
      setHidden([]);
      return;
    }

    if (visibleBreadcrumbs === 1 && total > 1) {
      setVisible([routes[total - 1]]);
      setHidden(routes.slice(0, -1).reverse());
      return;
    }

    setVisible([routes[0], ...routes.slice(-(visibleBreadcrumbs - 1))]);
    setHidden(routes.slice(1, -(visibleBreadcrumbs - 1)).reverse());
  }, [routes, visibleBreadcrumbs]);

  // --- Render ---
  return (
    <Breadcrumb className="flex-1 min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {hidden.length > 0 && visibleBreadcrumbs === 1 && (
          <>
            <BreadcrumbItem>
              <DropdownMenu modal>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="size-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-32" align="start">
                  {hidden.map((r, i) => (
                    <Link key={i} href={r.path} className="block w-full">
                      <DropdownMenuItem>{r.name}</DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {visible.map((route, idx) => (
          <React.Fragment key={route.path}>
            {idx === 1 && hidden.length > 0 && visibleBreadcrumbs > 1 && (
              <>
                <BreadcrumbItem>
                  <DropdownMenu modal>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="size-4" />
                      <span className="sr-only">Toggle menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-32" align="start">
                      {hidden.map((r, i) => (
                        <Link key={i} href={r.path} className="block w-full">
                          <DropdownMenuItem>{r.name}</DropdownMenuItem>
                        </Link>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}

            <BreadcrumbItem>
              <Link
                href={route.path}
                className={cn(
                  "truncate flex items-center gap-2 min-w-0",
                  idx === visible.length - 1 ? "text-foreground" : "",
                  route.path === "/" ? "logo" : ""
                )}
              >
                {route.path === "/" && (
                  <div className="size-6 bg-[#171717] rounded-full">
                    <img src="/n.svg" alt="NoteHub Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <span className="truncate">{route.name}</span>
              </Link>
            </BreadcrumbItem>

            {idx < visible.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
