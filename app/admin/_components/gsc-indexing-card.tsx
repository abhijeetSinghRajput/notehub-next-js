"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Label,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

type Props = {
  indexed: number;
  notIndexed: number;
  total: number;
  lastSynced: string | null;
};

const chartConfig = {
  indexed: {
    label: "Indexed",
    color: "rgb(16, 185, 129)",
  },
  notIndexed: {
    label: "Not Indexed",
    color: "rgb(244, 63, 94)",
  },
} satisfies ChartConfig;

const MIN_VISUAL = 12;
const GAP_SIZE = 4;

export default function GscIndexingCard({
  indexed,
  notIndexed,
  total,
  lastSynced,
}: Props) {
  const visualIndexed = indexed > 0 ? Math.max(indexed, MIN_VISUAL) : 0;
  const visualNotIndexed =
    notIndexed > 0 ? Math.max(notIndexed, MIN_VISUAL) : 0;
  const gap = visualIndexed > 0 && visualNotIndexed > 0 ? GAP_SIZE : 0;
  const visualTotal = visualIndexed + gap + visualNotIndexed;

  const chartData = [
    { indexed: visualIndexed, gap, notIndexed: visualNotIndexed },
  ];

  return (
    <Card className="flex flex-col max-w-110 w-full bg-card border border-border/60 shadow-sm shrink-0 select-none gap-0 py-3">
      <CardHeader className="items-start pb-2 pt-1 px-5">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/75">
            Google Indexing
          </CardTitle>
          {lastSynced && (
            <span className="text-[10px] text-muted-foreground/50">
              Synced {new Date(lastSynced).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-row items-center justify-between gap-3 sm:gap-6 pb-2 pt-1 px-3 sm:px-5">
        {/* Legend */}
        <div className="flex flex-col justify-center flex-1 gap-2 sm:gap-3 pl-1 sm:pl-2 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#10b981] shrink-0" />
            <span className="text-[12px] font-medium text-foreground">
              Indexed:{" "}
              <span className="font-semibold text-muted-foreground/80 ml-0.5">
                {indexed}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#f43f5e] shrink-0" />
            <span className="text-[12px] font-medium text-foreground">
              Not Indexed:{" "}
              <span className="font-semibold text-muted-foreground/80 ml-0.5">
                {notIndexed}
              </span>
            </span>
          </div>
          {!lastSynced && (
            <span className="text-[10px] text-muted-foreground/50 mt-1">
              Not synced yet
            </span>
          )}
        </div>

        {/* Chart */}
        <div className="h-22.5 w-41.25 sm:h-30 sm:w-55 relative shrink-0 overflow-visible">
          <div className="scale-75 sm:scale-100 origin-top-left absolute top-0 left-0 w-55 h-55 overflow-visible">
            <ChartContainer
              config={chartConfig}
              className="w-55 h-55 [&_svg]:overflow-visible"
            >
              <RadialBarChart
                data={chartData}
                endAngle={180}
                innerRadius={80}
                outerRadius={110}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, visualTotal > 0 ? visualTotal : 1]}
                  tick={false}
                />

                {/* Reversed order — recharts renders right to left with endAngle=180 */}
                <RadialBar
                  name="indexed"
                  dataKey="indexed"
                  fill="var(--color-indexed)"
                  stackId="a"
                  cornerRadius={5}
                  forceCornerRadius={true}
                  className="stroke-transparent"
                />

                <RadialBar
                  name="gap"
                  dataKey="gap"
                  fill="transparent"
                  fillOpacity={0}
                  strokeOpacity={0}
                  stackId="a"
                  className="stroke-transparent"
                />

                <RadialBar
                  name="notIndexed"
                  dataKey="notIndexed"
                  fill="var(--color-notIndexed)"
                  stackId="a"
                  cornerRadius={5}
                  forceCornerRadius={true}
                  className="stroke-transparent"
                />

                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, ...props }) => {
                    const filtered = (payload ?? []).filter(
                      (item) => item.dataKey !== "gap",
                    );
                    return (
                      <ChartTooltipContent
                        active={active}
                        payload={filtered}
                        hideLabel
                        formatter={(_, name) => {
                          const nameStr = String(name);
                          let label = "";
                          let value = 0;
                          let color = "";

                          if (nameStr === "indexed") {
                            label = "Indexed";
                            value = indexed;
                            color = "rgb(16, 185, 129)";
                          } else if (nameStr === "notIndexed") {
                            label = "Not Indexed";
                            value = notIndexed;
                            color = "rgb(244, 63, 94)";
                          } else {
                            return null;
                          }

                          return (
                            <div className="flex items-center gap-1.5 w-full">
                              <div
                                className="h-2 w-2 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: color }}
                              />
                              <div className="flex flex-1 justify-between items-center leading-none">
                                <span className="text-muted-foreground mr-4">
                                  {label}
                                </span>
                                <span className="font-mono font-medium text-foreground tabular-nums">
                                  {value.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    );
                  }}
                />

                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 16}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 4}
                              className="fill-muted-foreground text-xs uppercase tracking-wider font-semibold"
                            >
                              BLOGS
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
