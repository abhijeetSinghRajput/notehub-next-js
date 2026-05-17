"use client";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Loader2, RefreshCcw, Trash2 } from "lucide-react";

const CELL_SIZE = 10;
const CELL_GAP = 3;
const STEP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 20;

const COLORS = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#1e1e1f", "#0e4429", "#006b32", "#26a642", "#3ad454"],
};

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface GitHubContributionProps {
  weeks: ContributionWeek[];
  totalContributions: number;
  isOwner?: boolean;
  onDisconnect?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

// Accepts contributions from GitHub GraphQL API response
// shape: [{ date: "2024-05-14", contributionCount: 3 }]
export default function GitHubContribution({
  weeks,
  totalContributions,
  isOwner = false,
  onDisconnect,
  onRefresh,
}: GitHubContributionProps) {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    const confirmed = window.confirm("Disconnect your GitHub account from NoteHub?");
    if (!confirmed) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const colors = isDark ? COLORS.dark : COLORS.light;

  function getLevel(count: number) {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 9) return 3;
    return 4;
  }


  // Build month labels
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        x: DAY_LABEL_WIDTH + wi * STEP,
        label: new Date(firstDay.date).toLocaleString("default", { month: "short" }),
      });
      lastMonth = month;
    }
  });

  const svgWidth = DAY_LABEL_WIDTH + weeks.length * STEP;
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * STEP;

  return (
    <>
      <div className="flex justify-between items-center gap-8 mb-2">
        <p className="text-xs text-muted-foreground mb-2">
          <span className="font-medium text-foreground">
            {totalContributions.toLocaleString()}
          </span>{" "}
          contributions in the last year
        </p>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              tooltip="Disconnect GitHub"
              onClick={handleDisconnect}
              disabled={isDisconnecting || isRefreshing}
            >
              {isDisconnecting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              tooltip="Refresh contributions"
              onClick={handleRefresh}
              disabled={isRefreshing || isDisconnecting}
            >
              {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
            </Button>
          </div>
        )}
      </div>
      <div className="w-full overflow-x-auto">

        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
        >
          {/* Month labels */}
          {monthLabels.map(({ x, label }, i) => (
            <text
              key={i}
              x={x}
              y={12}
              fontSize={10}
              fill={isDark ? "#8b949e" : "#57606a"}
              fontFamily="monospace"
            >
              {label}
            </text>
          ))}

          {/* Day labels (Mon, Wed, Fri) */}
          {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
            label ? (
              <text
                key={i}
                x={DAY_LABEL_WIDTH - 4}
                y={MONTH_LABEL_HEIGHT + i * STEP + CELL_SIZE - 2}
                fontSize={10}
                textAnchor="end"
                fill={isDark ? "#8b949e" : "#57606a"}
                fontFamily="monospace"
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.contributionDays.map((day, di) => {
              const x = DAY_LABEL_WIDTH + wi * STEP;
              const y = MONTH_LABEL_HEIGHT + di * STEP;
              return (
                <rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  fill={colors[getLevel(day.contributionCount)]}
                  data-date={day.date}
                  data-count={day.contributionCount}
                >
                  <title>
                    {day.contributionCount === 0
                      ? `No contributions on ${day.date}`
                      : `${day.contributionCount} contributions on ${day.date}`}
                  </title>
                </rect>
              );
            })
          )}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-xs text-muted-foreground">Less</span>
        {colors.map((c, i) => (
          <div
            key={i}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }}
          />
        ))}
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </>

  );
}
