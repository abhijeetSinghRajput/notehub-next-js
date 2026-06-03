"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ban,
  FileText,
  LayoutDashboard,
  Send,
  UserRoundCheck, UsersRound
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
    width="672"
    height="670"
    viewBox="0 0 672 670"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M59.3424 0.53966C35.7794 4.39166 16.7714 18.7877 6.40337 40.6327C-2.66163 59.7327 -2.07363 82.4267 7.98737 101.767C14.3194 113.939 26.3354 125.86 37.8454 131.39C49.4274 136.955 56.5754 138.607 68.9864 138.589C80.7804 138.572 89.7594 136.821 98.1364 132.904L103.93 130.194L178.491 204.755L253.052 279.316L248.997 286.71C245.054 293.898 238.842 310.953 238.842 314.587C238.842 315.579 238.28 316.581 237.592 316.815C235.402 317.559 203.032 317.755 198.346 317.052C195.326 316.599 193.842 315.886 193.842 314.888C193.842 312.499 186.403 297.535 182.638 292.348C177.476 285.239 166.355 276.119 157.342 271.603C124.563 255.18 82.2314 268.527 65.4324 300.582C58.9624 312.928 57.3354 319.619 57.4024 333.604C57.4884 351.292 60.2894 360.506 69.8844 374.657C78.3664 387.167 95.9524 399.036 110.609 402.142C119.105 403.943 135.651 403.986 142.842 402.227C165.951 396.575 185.536 378.727 193.181 356.354C193.727 354.757 195.74 354.604 216.179 354.604H238.578L240.301 360.854C242.22 367.821 249.538 383.965 252.946 388.75L255.158 391.857L244.75 402.001C239.026 407.58 220.842 425.175 204.342 441.101C164.313 479.736 147.319 496.212 129.354 513.805C121.097 521.89 111.654 530.963 108.369 533.965C102.744 539.108 102.25 539.349 99.8694 538.125C94.7714 535.504 83.5604 532.628 76.0514 532.014C35.2924 528.684 -0.697635 563.828 2.15037 604.179C3.44937 622.58 9.64536 636.383 22.3224 649.112C37.8744 664.73 58.6204 671.767 79.9234 668.652C100.617 665.627 116.724 655.454 127.991 638.295C134.548 628.31 137.307 620.463 138.957 607.104C140.367 595.682 138.601 584.464 133.561 572.834L130.05 564.731L137.196 557.975C141.126 554.259 153.117 542.64 163.842 532.154C174.567 521.668 194.811 502.067 208.829 488.596C222.846 475.126 245.02 453.66 258.103 440.894L281.89 417.684L287.116 420.77C294.017 424.846 305.508 429.403 312.342 430.776L317.842 431.88V455.662V479.443L312.592 481.136C305.496 483.425 299.656 486.83 291.519 493.422C266.771 513.473 259.707 548.892 274.432 579.09C281.698 593.99 297.827 607.856 314.211 613.288C321.51 615.708 323.825 615.987 336.842 616.018C350.343 616.049 351.859 615.858 358.842 613.237C370.45 608.88 379.063 603.211 387.17 594.594C402.737 578.046 409.619 555.415 405.407 534.626C401.964 517.637 393.654 503.442 381.078 493.068C374.871 487.949 363.152 481.473 357.55 480.067L354.842 479.387V455.496C354.842 434.118 355.013 431.604 356.465 431.604C360.05 431.604 379.707 424.307 385.208 420.935L391.074 417.338L466.13 492.393L541.185 567.449L538.55 573.32C532.855 586.011 531.402 600.717 534.407 615.264C540.046 642.567 562.609 663.905 590.815 668.613C614.06 672.492 641.507 661.796 655.262 643.499C665.515 629.859 669.899 616.831 670.008 599.676C670.131 580.228 663.579 565.321 648.619 551.018C634.713 537.722 620.862 532.143 601.842 532.175C590.032 532.195 583.386 533.532 573.673 537.841L567.005 540.799L492.428 466.213L417.852 391.628L421.376 386.118C425.324 379.947 429.829 369.248 432.436 359.854L434.17 353.604H485.006C528.578 353.604 535.842 353.81 535.842 355.044C535.842 355.835 537.937 360.581 540.497 365.59C547.306 378.913 558.248 389.811 571.085 396.056C586.332 403.473 600.541 405.336 616.588 402.021C657.164 393.64 681.474 351.165 668.026 312.15C664.086 300.72 659.802 293.922 651.098 285.289C642.152 276.416 633.901 271.322 622.842 267.846C615.642 265.583 612.583 265.18 602.842 265.21C595.341 265.234 589.129 265.833 584.979 266.934C571.587 270.484 555.214 281.301 547.362 291.784C543.519 296.915 537.384 308.595 536.334 312.779C535.936 314.364 534.799 315.627 533.505 315.92C532.316 316.188 509.543 316.313 482.901 316.197L434.46 315.985L432.677 308.544C431.697 304.452 428.359 296.034 425.26 289.838C420.608 280.539 419.842 278.309 420.871 277.069C422.379 275.253 447.412 250.771 465.346 233.574C483.174 216.479 540.429 161.014 556.519 145.252C571.059 131.009 569.405 131.695 579.977 135.515C597.598 141.88 619.998 139.662 636.842 129.883C646.683 124.17 658.581 111.8 663.561 102.104C669.65 90.2467 671.232 83.3487 671.244 68.6037C671.252 57.5057 670.942 55.2067 668.474 48.1037C664.678 37.1767 660.688 30.5377 653.052 22.4437C641.603 10.3067 629.591 3.76766 613.708 1.02766C578.045 -5.12734 543.754 17.3677 534.321 53.1037C530.651 67.0087 532.983 87.0167 539.862 100.644L543.019 106.898L539.18 110.593C537.069 112.626 522.067 127.054 505.842 142.657C489.617 158.259 474.08 173.293 471.315 176.065C459.022 188.388 393.55 251.104 392.978 251.104C392.628 251.104 387.617 248.737 381.842 245.844C376.067 242.951 367.633 239.576 363.1 238.344L354.857 236.104L354.85 186.434L354.842 136.765L359.63 135.174C367.189 132.664 379.358 125.044 385.302 119.101C398.894 105.508 405.861 88.4317 405.827 68.7887C405.791 47.6437 396.229 28.0627 379.577 15.0327C365.646 4.13266 353.96 0.170657 335.842 0.203657C322.54 0.227657 316.297 1.73266 304.842 7.67766C290.605 15.0657 280.088 25.9567 273.227 40.4137C268.221 50.9627 266.524 59.8477 267.176 72.1037C268.163 90.6777 273.332 103.334 285.185 116.2C293.276 124.983 300.75 130.214 310.889 134.192L317.842 136.92V186.573V236.226L312.592 237.528C304.563 239.521 293.081 244.274 285.566 248.717L278.791 252.724L204.662 178.491L130.534 104.259L131.823 101.181C136.901 89.0647 138.162 83.8067 138.622 72.8357C138.898 66.2747 138.611 59.1077 137.937 55.6797C133.035 30.7647 112.986 9.17866 88.6474 2.61166C79.8554 0.239658 66.8174 -0.68234 59.3424 0.53966ZM348.909 274.617C351.845 275.174 358.094 277.487 362.795 279.758C378.746 287.464 392.423 304.636 395.882 321.299C397.562 329.388 396.597 345.446 393.928 353.81C389.698 367.07 378.674 380.249 365.769 387.475C354.053 394.035 334.6 396.485 321.302 393.076C300.355 387.706 282.861 370.13 277.331 348.901C274.031 336.232 276.299 318.575 282.91 305.46C287.202 296.945 299.191 284.96 307.715 280.664C320.145 274.398 335.708 272.113 348.909 274.617Z"
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
