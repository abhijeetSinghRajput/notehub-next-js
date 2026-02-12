"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname, useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

type TabItem =
  | {
      label: string;
      icon: LucideIcon;
      path: string;
      type?: undefined;
    }
  | {
      type: "separator";
      label?: never;
      icon?: never;
      path?: never;
    };

interface ExpandedTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number) => void;
}

export function ExpandedTabs({
  tabs,
  className,
  activeColor = "",
  onChange,
}: ExpandedTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [selected, setSelected] = React.useState<number | null>(null);

  React.useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => {
      if (!("path" in tab) || !tab.path) return false;
      return pathname.startsWith(tab.path);
    });

    if (activeIndex !== -1) {
      setSelected(activeIndex);
      onChange?.(activeIndex);
    }
  }, [pathname, tabs, onChange]);

  const handleSelect = (index: number) => {
    const tab = tabs[index];
    if (!tab || !("path" in tab) || !tab.path) return;

    setSelected(index);
    onChange?.(index);
    router.push(tab.path);
  };

  const Separator = () => (
    <div className="h-6 w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex gap-2 rounded-xl w-max border bg-muted/30 p-1 shadow-sm",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        if ("type" in tab && tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isActive = selected === index;
        const showLabel = isActive || !isMobile;

        return (
          <Button
            key={tab.label}
            tooltip={isActive || showLabel ? "" : tab.label}
            onClick={() => handleSelect(index)}
            variant={isActive ? "secondary" : "ghost"}
            className={cn("rounded-xl", showLabel ? "gap-2" : "gap-0")}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {showLabel && (
              <span className="whitespace-nowrap">{tab.label}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
