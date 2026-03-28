"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoIcon from "./icons/logo/LogoIcon";

interface RouteItem {
  name: string;
  path: string;
}

export default function AppBreadcrumbs() {
  const pathname = usePathname();
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 3;
    const width = window.innerWidth;
    if (width >= 1536) return 5; // 2xl
    if (width >= 1280) return 4; // xl
    if (width >= 1024) return 3; // lg
    if (width >= 768) return 2; // md
    return 1; // sm
  };

  const [visibleBreadcrumbs, setVisibleBreadcrumbs] = useState(getVisibleCount);

  // --- Calculate visibleBreadcrumbs based on viewport width ---
  useEffect(() => {
    const onResize = () => setVisibleBreadcrumbs(getVisibleCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- Generate route items from pathname ---
  const routes = useMemo<RouteItem[]>(() => {
    const segments = pathname.split("/").filter(Boolean);
    const tempRoutes: RouteItem[] = [{ name: "NoteHub", path: "/" }];
    let path = "/";

    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i];
      path += `${segment}/`;
      
      if (segment === "note") {
        const noteId = segments[++i];
        if (noteId) {
          path += `${noteId}/`;
          // TODO: Implement getNoteName to fetch note title dynamically
          const noteName = `Note ${noteId}`;
          tempRoutes.push({ name: noteName, path });
        }
      } else {
        const name = segment;
        tempRoutes.push({ name, path });
      }
    }

    return tempRoutes;
  }, [pathname]);

  // --- Calculate visible / hidden breadcrumbs ---
  const { visible, hidden } = useMemo(() => {
    if (routes.length === 0) return { visible: [], hidden: [] };
    const total = routes.length;

    // Special case: if only 2 routes and first is '/', always show both (logo + current)
    if (total === 2 && routes[0].path === "/") {
      return { visible: routes, hidden: [] };
    }

    if (total <= visibleBreadcrumbs) {
      return { visible: routes, hidden: [] };
    }

    if (visibleBreadcrumbs === 1 && total > 1) {
      return {
        visible: [routes[total - 1]],
        hidden: routes.slice(0, -1).reverse(),
      };
    }

    return {
      visible: [routes[0], ...routes.slice(-(visibleBreadcrumbs - 1))],
      hidden: routes.slice(1, -(visibleBreadcrumbs - 1)).reverse(),
    };
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

            <BreadcrumbItem className={cn(idx === visible.length - 1 && "min-w-0")}>
              <Link
                href={route.path}
                aria-label={route.name}
                className={cn(
                  "flex items-center gap-2 min-w-0",
                  idx === visible.length - 1 ? "text-foreground truncate" : "",
                  route.path === "/" ? "logo" : "",
                )}
              >
                {route.path === "/" && (
                  <LogoIcon aria-hidden="true"/>
                )}
                <span
                  className={cn(
                    "truncate",
                    route.path === "/"
                      ? pathname === "/"
                        ? "inline"
                        : "hidden" // hide home name if not on /
                      : "inline", // all other route names visible
                  )}
                >
                  {route.name}
                </span>
              </Link>
            </BreadcrumbItem>

            {idx < visible.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}