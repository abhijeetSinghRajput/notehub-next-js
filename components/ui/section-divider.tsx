import React from "react";
import { Label } from "./label";

const SectionDivider = ({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) => (
  <div className="flex items-center gap-6 pb-4">
    <span className="border-b flex-1" />
    <div className="flex items-center gap-2">
      <Icon className="size-4" />
      <Label className="">{label}</Label>
    </div>
    <span className="border-b flex-1" />
  </div>
);

export default SectionDivider;
