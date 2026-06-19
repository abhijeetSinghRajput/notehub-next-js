"use client";

import { Loader2 } from "lucide-react";
import type { HealthFilter } from "@/app/stores/useAdminStore";

type CountKey = "all" | "good" | "warning" | "critical";

type Props = {
  health: HealthFilter;
  counts: Record<CountKey, number>;
  isLoading: boolean;
  onChange: (filter: HealthFilter) => void;
};

const FILTERS: {
  id: CountKey;
  label: string;
  sub: string;
  dotColor: string | null;
}[] = [
  { id: "all",      label: "All blogs",       sub: "across all states",  dotColor: null               },
  { id: "good",     label: "Healthy · 80+",   sub: "passing threshold",  dotColor: "bg-emerald-500"   },
  { id: "warning",  label: "Warning · 50–79", sub: "needs attention",    dotColor: "bg-amber-500"     },
  { id: "critical", label: "Critical · <50",  sub: "action required",    dotColor: "bg-rose-500"      },
];

export default function HealthFilterCards({
  health,
  counts,
  isLoading,
  onChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      {FILTERS.map((f) => {
        const isActive    = health === f.id;
        const countValue  = counts[f.id];

        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id as HealthFilter)}
            className={`border rounded-lg p-4 text-left transition-all duration-150 cursor-pointer select-none ${
              isActive
                ? "bg-foreground border-foreground text-background shadow-sm"
                : "bg-card border-border/60 hover:border-border hover:bg-secondary/40 text-foreground"
            }`}
          >
            <span
              className={`text-[11px] font-medium uppercase tracking-[0.06em] block mb-2 ${
                isActive ? "text-background/60" : "text-muted-foreground/80"
              }`}
            >
              {f.dotColor && (
                <span
                  className={`inline-block w-1.25 h-1.25 rounded-full mr-1.5 shrink-0 ${f.dotColor}`}
                />
              )}
              {f.label}
            </span>
            <div
              className={`text-[22px] font-medium leading-none ${
                isActive ? "text-background" : "text-foreground"
              }`}
            >
              {isLoading && countValue === 0 ? (
                <Loader2 className="h-5 w-5 animate-spin inline-block text-muted-foreground/60" />
              ) : (
                countValue
              )}
            </div>
            <div
              className={`text-[11px] mt-1 ${
                isActive ? "text-background/40" : "text-muted-foreground/60"
              }`}
            >
              {f.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}