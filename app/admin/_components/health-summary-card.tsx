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
  good: number;
  warning: number;
  critical: number;
  total: number;
};

const chartConfig = {
  healthy: {
    label: "Healthy",
    color: "rgb(16, 185, 129)",
  },
  warning: {
    label: "Warning",
    color: "rgb(245, 158, 11)",
  },
  critical: {
    label: "Critical",
    color: "rgb(244, 63, 94)",
  },
} satisfies ChartConfig;

export default function HealthSummaryCard({
  good,
  warning,
  critical,
  total,
}: Props) {

  // Visual offsets for stacked radial bar rendering (avoids collapse of small segments)
  const visualHealthy = good > 0 ? Math.max(good, 12) : 0;
  const visualWarning = warning > 0 ? Math.max(warning, 12) : 0;
  const visualCritical = critical > 0 ? Math.max(critical, 12) : 0;

  // Define visual gaps (only if adjacent active segments exist)
  const gap1 =
    visualHealthy > 0 && (visualWarning > 0 || visualCritical > 0) ? 3 : 0;
  const gap2 = visualWarning > 0 && visualCritical > 0 ? 3 : 0;
  const visualTotal =
    visualHealthy + gap1 + visualWarning + gap2 + visualCritical;

  const chartData = [
    {
      healthy: visualHealthy,
      gap1: gap1,
      warning: visualWarning,
      gap2: gap2,
      critical: visualCritical,
    },
  ];

  return (
    <Card className="flex flex-col max-w-110 w-full bg-card border border-border/60 shadow-sm shrink-0 select-none gap-0 py-3">
      <CardHeader className="items-start pb-2 pt-1 px-5">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/75">
          Health Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-row items-center justify-between gap-3 sm:gap-6 pb-2 pt-1 px-3 sm:px-5">
        {/* Custom Legend on the Left */}
        <div className="flex flex-col justify-center flex-1 gap-2 sm:gap-3 pl-1 sm:pl-2 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#10b981] shrink-0" />
            <span className="text-[12px] font-medium text-foreground">
              Healthy:{" "}
              <span className="font-semibold text-muted-foreground/80 ml-0.5">
                ≥ 80
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#f59e0b] shrink-0" />
            <span className="text-[12px] font-medium text-foreground">
              Warning:{" "}
              <span className="font-semibold text-muted-foreground/80 ml-0.5">
                ≥ 50
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#f43f5e] shrink-0" />
            <span className="text-[12px] font-medium text-foreground">
              Critical:{" "}
              <span className="font-semibold text-muted-foreground/80 ml-0.5">
                &lt; 50
              </span>
            </span>
          </div>
        </div>

        {/* Radial Chart on the Right (overflow-visible to prevent tooltip clipping) */}
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
                <RadialBar
                  name="Healthy"
                  dataKey="healthy"
                  fill="var(--color-healthy)"
                  stackId="a"
                  cornerRadius={5}
                  forceCornerRadius={true}
                  className="stroke-transparent stroke-2"
                />
                <RadialBar
                  name="Gap1"
                  dataKey="gap1"
                  fill="transparent"
                  stackId="a"
                  className="stroke-transparent"
                />
                <RadialBar
                  name="Warning"
                  dataKey="warning"
                  fill="var(--color-warning)"
                  stackId="a"
                  cornerRadius={5}
                  forceCornerRadius={true}
                  className="stroke-transparent stroke-2"
                />
                <RadialBar
                  name="Gap2"
                  dataKey="gap2"
                  fill="transparent"
                  stackId="a"
                  className="stroke-transparent"
                />
                <RadialBar
                  name="Critical"
                  dataKey="critical"
                  fill="var(--color-critical)"
                  stackId="a"
                  cornerRadius={5}
                  forceCornerRadius={true}
                  className="stroke-transparent stroke-2"
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, content, ...props }) => {
                    const filteredPayload = payload
                      ? payload.filter(
                          (item) =>
                            item.name !== "gap1" &&
                            item.name !== "gap2" &&
                            item.name !== "Gap1" &&
                            item.name !== "Gap2" &&
                            item.dataKey !== "gap1" &&
                            item.dataKey !== "gap2",
                        )
                      : [];
                    return (
                      <ChartTooltipContent
                        {...props}
                        active={active}
                        payload={filteredPayload}
                        hideLabel
                        formatter={(value, name) => {
                          const nameStr = String(name).toLowerCase();
                          let actualValue = value;
                          let label = "";
                          let color = "";

                          if (nameStr === "healthy") {
                            actualValue = good;
                            label = "Healthy";
                            color = "rgb(16, 185, 129)";
                          } else if (nameStr === "warning") {
                            actualValue = warning;
                            label = "Warning";
                            color = "rgb(245, 158, 11)";
                          } else if (nameStr === "critical") {
                            actualValue = critical;
                            label = "Critical";
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
                                  {Number(actualValue).toLocaleString()}
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
                        const displayTotal = total;
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
                              {displayTotal.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 4}
                              className="fill-muted-foreground text-xs uppercase tracking-wider font-semibold"
                            >
                              Blogs
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
