"use client";

import { memo } from "react";

import TooltipWrapper from "../TooltipWrapper";

/**
 * A row showing an icon, label, and value — used for Created / Last Modified dates.
 */
const DateMeta = memo(
  ({
    icon,
    label,
    value,
    title,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    title: string;
  }) => (
    <div className="flex gap-1 flex-col md:gap-4 md:flex-row items-center">
      <div className="flex gap-2 items-center">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <TooltipWrapper message={title}>
        <span className="text-sm font-medium">
          {value}
        </span>
      </TooltipWrapper>
    </div>
  ),
);
DateMeta.displayName = "DateMeta";

export default DateMeta;
