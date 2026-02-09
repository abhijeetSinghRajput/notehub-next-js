"use client"
import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname, useRouter } from "next/navigation";

export function ExpandedTabs({ tabs, className, activeColor = "", onChange }) {
  const router = useRouter();
  const pathname = usePathname();

  const isMobile = useIsMobile();
  const [selected, setSelected] = React.useState(null);

  // sync with route
  React.useEffect(() => {
    const activeIndex = tabs.findIndex((tab) =>
      pathname.startsWith(tab.path)
    );

    if (activeIndex !== -1) {
      setSelected(activeIndex);
      onChange?.(activeIndex);
    }
  }, [pathname, tabs, onChange]);

  const handleSelect = (index) => {
    const tab = tabs[index];
    if (!tab?.path) return;

    setSelected(index);
    onChange?.(index);
    router.push(tab.path);
  };

  const Separator = () => (
    <div className="h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex gap-2 rounded-xl w-max border bg-muted/30 p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isActive = selected === index;
        const showLabel = isActive || !isMobile;

        return (
          <button
            key={tab.label}
            onClick={() => handleSelect(index)}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium",
              "transition-all duration-300 ease-out",
              showLabel ? "gap-2" : "gap-0",
              isActive
                ? cn("bg-primary/20", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />

            {/* Label animation */}
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap",
                "transition-all duration-300 ease-out",
                showLabel
                  ? "max-w-[200px] opacity-100 ml-1"
                  : "max-w-0 opacity-0 ml-0"
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
