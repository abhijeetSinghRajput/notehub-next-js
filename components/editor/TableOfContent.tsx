import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Anchor {
  id: string;
  dom: HTMLElement;
  isActive: boolean;
  level: number;
  textContent: string;
}

const TableOfContent = ({ className }: { className?: string }) => {
  const [anchors, setAnchors] = useState<Anchor[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Anchor[]>;
      setAnchors(customEvent.detail);
    };
    window.addEventListener("toc-update", handler);
    return () => window.removeEventListener("toc-update", handler);
  }, []);

  return (
    <div className={cn("sticky top-24 space-y-2 text-sm border", className)}>
      {anchors.map((a) => (
        <div
          key={a.id}
          onClick={() => a.dom.scrollIntoView({ behavior: "smooth" })}
          className={cn(
            "cursor-pointer text-muted-foreground hover:text-primary",
            a.isActive && "text-primary font-semibold"
          )}
          style={{ paddingLeft: a.level * 12 }}
        >
          {a.textContent}
        </div>
      ))}
    </div>
  );
};

export default TableOfContent;
