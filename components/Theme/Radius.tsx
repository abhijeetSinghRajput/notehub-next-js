import { Label } from "@radix-ui/react-dropdown-menu";
import React from "react";
import { Button } from "@/components/ui/button";

const radius = [0, 0.3, 0.5, 0.75, 1.0];

interface RadiusProps {
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
}

const Radius = ({ selectedRadius, onRadiusChange }: RadiusProps) => {
  return (
    <div className="space-y-2">
      <Label>Radius</Label>
      <div className="flex gap-2 flex-wrap">
        {radius.map((r) => (
          <Button
            variant="outline"
            key={r}
            onClick={() => onRadiusChange(r)}
            className={`${selectedRadius == r ? "ring-2 ring-ring ring-offset-2 ring-offset-card bg-muted" : ""}`}
          >
            <span
              className="size-4 sm:size-6 border-t-2 border-l-2 bg-primary/20 border-primary/70 grayscale"
              style={{ borderTopLeftRadius: `${r}rem` }}
            />
            {r}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Radius;
