"use client";

import { ReactElement, useEffect, useRef } from "react";
import type { TocItem } from "@/lib/note/types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TopTocProps {
  toc: TocItem[];
  tocOpen: boolean;
  setTocOpen: React.Dispatch<React.SetStateAction<boolean>>;
  progress: number;
  activeId: string | null;
  handleTocItemClick: (id: string) => void;
}

export default function TopToc({
  toc,
  tocOpen,
  setTocOpen,
  progress,
  activeId,
  handleTocItemClick,
}: TopTocProps): ReactElement | null {
  const activeItem = toc.find((item) => item.id === activeId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!tocOpen || !activeRef.current || !scrollRef.current) return;

    activeRef.current.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeId, tocOpen]);

  const renderToc = (): ReactElement [] => {
    const STEP = 20;
    const stack: number[] = [];

    return toc.map((item) => {
      while (stack.length && stack[stack.length - 1] >= item.level) {
        stack.pop();
      }

      const indentLevel = stack.length;
      stack.push(item.level);

      const isActive = activeId === item.id;
      const ancestors = stack.slice(0, -1);

      return (
        <div
          key={item.id}
          className="relative"
          style={{ paddingLeft: `${indentLevel * STEP + 8}px` }}
        >
          {ancestors.map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{ left: `${i * STEP + 12}px` }}
            >
              <div className="w-px h-full bg-primary/10" />
            </div>
          ))}

          <div className="relative z-10">
            <button
              ref={isActive ? activeRef : null}
              onClick={() => {
                handleTocItemClick(item.id);
                setTocOpen(false);
              }}
              className={cn(
                "cursor-pointer flex items-center w-full py-1.25 pr-3 text-left",
                "transition-colors duration-100",
              )}
            >
              <span
                className={cn(
                  "text-muted-foreground hover:text-foreground font-mono text-sm leading-snug truncate transition-colors duration-100",
                  isActive && "font-medium text-foreground",
                )}
              >
                {item.text}
              </span>
            </button>
          </div>
        </div>
      );
    });
  };

  if (toc?.length <= 1) return null;

  return (
    <div className="lg:hidden sticky top-16 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b shadow-lg">
      <Popover open={tocOpen} onOpenChange={setTocOpen}>
        <PopoverTrigger asChild>
          <button className="flex w-full h-10 items-center text-sm text-muted-foreground gap-2.5 px-4 py-2.5 text-start focus-visible:outline-none">
            <div className="flex gap-2 items-center w-full">
              <div className="text-foreground shrink-0 w-9 font-medium text-xs">
                {progress} %
              </div>

              <span style={{ display: "grid", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    gridRow: 1,
                    gridColumn: 1,
                    margin: "auto 0",
                  }}
                  className={cn(
                    "truncate font-medium text-foreground text-sm",
                    "transition-[opacity,translate,color] duration-300 ease-in-out",
                    tocOpen
                      ? "opacity-0 -translate-y-full pointer-events-none"
                      : "opacity-100 translate-y-0",
                  )}
                >
                  {activeItem?.text ?? "Table of contents"}
                </span>

                <span
                  style={{
                    gridRow: 1,
                    gridColumn: 1,
                    margin: "auto 0",
                  }}
                  className={cn(
                    "truncate text-muted-foreground text-sm",
                    "transition-[opacity,translate] duration-300 ease-in-out",
                    tocOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-full pointer-events-none",
                  )}
                >
                  Table of Contents
                </span>
              </span>
            </div>

            <ChevronDown
              className={cn(
                "size-4 shrink-0 mx-0.5 transition-transform duration-200",
                tocOpen && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={0}
          className="w-[calc(100vw-2rem)] bg-background/80 backdrop-blur-sm max-w-none p-0 border-0 rounded-none shadow-none"
        >
          <div className="flex flex-col px-4 max-h-[50vh] overflow-hidden">
            <div
              ref={scrollRef}
              className="relative min-h-0 text-sm overflow-auto [scrollbar-width:none] py-3"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, white 16px, white calc(100% - 16px), transparent)",
              }}
            >
              <div className="relative">{renderToc()}</div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}