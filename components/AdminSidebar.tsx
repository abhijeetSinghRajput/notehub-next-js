"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ban,
  FileText,
  LayoutDashboard,
  Send,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

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

const GraphIcon = () => (
  <svg
    width="512"
    height="474"
    viewBox="0 0 512 474"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M190.182 1.51038C179.682 3.81038 170.082 10.9104 164.382 20.6104C159.282 29.2104 158.882 34.1104 158.882 88.5104C158.882 116.01 159.282 141.11 159.882 144.31C161.982 157.51 170.382 168.51 182.582 174.31L189.382 177.51L216.682 177.81L243.882 178.11V212.51V246.91L182.182 247.31C120.782 247.61 120.382 247.61 113.382 249.91C89.4819 257.81 72.2819 272.91 62.2819 294.61C57.1819 305.51 54.8819 317.61 54.8819 333.21V346.01H48.1819C27.2819 346.11 15.0819 351.51 6.48188 364.51C-0.018119 374.21 -0.218119 376.21 0.0818811 412.31L0.381881 444.51L2.98188 450.01C8.58188 461.81 19.9819 470.61 32.7819 473.01C39.7819 474.31 100.982 474.31 107.882 473.01C125.982 469.61 138.482 456.31 141.082 437.71C141.682 433.61 141.882 419.21 141.682 404.51C141.182 375.41 140.482 372.01 133.282 362.61C124.882 351.61 115.282 347.21 97.6819 346.31L85.8819 345.71V334.61C85.8819 328.21 86.5819 320.81 87.3819 317.11C91.6819 299.01 106.282 284.31 124.582 279.51C129.282 278.31 139.982 278.01 187.082 278.01H243.882V312.01V346.01H236.682C232.682 346.01 226.482 346.51 222.982 347.01C205.382 349.51 191.782 363.01 188.882 380.71C187.582 388.21 187.582 431.81 188.882 439.31C191.682 456.81 204.782 470.11 221.982 473.01C226.282 473.81 240.582 474.01 263.482 473.81C297.082 473.51 298.582 473.41 304.182 471.21C315.482 466.61 324.182 457.51 327.982 446.11C329.782 440.71 329.982 437.91 329.682 408.41L329.382 376.51L326.182 369.71C318.482 353.61 304.482 346.11 281.682 346.01H274.882V312.01V278.01H328.682C373.782 278.01 383.382 278.21 388.382 279.51C402.582 283.21 414.282 292.91 420.982 306.51C425.282 315.41 426.782 323.21 426.882 337.11V345.71L414.582 346.31C396.482 347.11 386.982 351.41 378.482 362.61C371.282 372.01 370.582 375.41 370.082 404.51C369.882 419.21 370.082 433.61 370.682 437.71C373.282 456.31 385.782 469.61 403.882 473.01C410.782 474.31 471.982 474.31 478.982 473.01C491.782 470.61 503.182 461.81 508.782 450.01L511.382 444.51L511.682 412.31C511.982 376.21 511.782 374.21 505.282 364.51C496.782 351.71 484.482 346.11 464.282 346.01H458.182L457.582 331.61C456.782 313.31 454.882 305.01 448.882 292.51C440.582 275.41 428.282 263.11 411.482 255.01C395.582 247.41 398.182 247.61 333.182 247.31L274.882 246.91V212.51V178.01H299.782C321.882 178.01 325.382 177.81 331.182 176.01C346.282 171.31 356.882 158.41 358.982 142.21C360.182 132.81 360.082 44.0104 358.882 35.5104C358.282 31.7104 356.782 26.2104 355.382 23.3104C350.382 12.3104 338.582 3.41038 325.982 1.01038C317.282 -0.58962 197.882 -0.18962 190.182 1.51038Z"
      fill="currentColor"
    />
  </svg>
);

const adminNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Link Graph", href: "/admin/graph", icon: GraphIcon },
  { title: "Users", href: "/admin/users", icon: UsersRound },
];

const mailerNavItems = [
  { title: "Campaigns", href: "/admin/campaign", icon: Send },
  { title: "Templates", href: "/admin/template", icon: FileText },
  { title: "Contacts", href: "/admin/contact", icon: UserRoundCheck },
  { title: "Unsubscribers", href: "/admin/unsubscribers", icon: Ban },
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
                <LogoIcon className="size-8!" />
                <div className="flex-1 grid text-sm text-left leading-tight">
                  <LogoText className="w-18 text-sm truncate" />
                  <span className="text-muted-foreground text-xs truncate">
                    Admin Panel
                  </span>
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
