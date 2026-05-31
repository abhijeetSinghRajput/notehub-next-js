"use client";

import { useEffect, useState } from "react";
import { useAdminStore, type HealthFilter } from "@/app/stores/useAdminStore";
import {
  Search,
  Loader2,
  Calendar,
  Clock,
  Award,
  Folder,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import SortSelector from "@/components/SortSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";

// Recharts & Custom Chart Imports
import {
  Label,
  PolarRadiusAxis,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent, type ChartConfig
} from "@/components/ui/chart";
import { formatTimeAgo } from "@/lib/utils";

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

export default function AdminOverviewPage() {
  const router = useRouter();
  const { fetchBlogs, isLoadingBlogs } = useAdminStore();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState<HealthFilter>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [sortBy, setSortBy] = useState("updated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Debouncing search for better UX & API performance
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Background counts for filter cards
  const [counts, setCounts] = useState({
    all: 0,
    good: 0,
    warning: 0,
    critical: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch blogs when filters, search, or sorting change
  useEffect(() => {
    setPage(1);
    fetchData(1, health, debouncedSearch, sortBy, sortDirection, true);
  }, [health, debouncedSearch, sortBy, sortDirection]);

  // Fetch count statistics for all health filters in the background when search string changes
  useEffect(() => {
    let active = true;
    const fetchCounts = async () => {
      try {
        const filters: HealthFilter[] = ["all", "good", "warning", "critical"];
        const promises = filters.map((h) =>
          fetchBlogs({
            page: 1,
            limit: 1,
            search: debouncedSearch,
            health: h,
          }),
        );
        const results = await Promise.all(promises);
        if (!active) return;

        setCounts({
          all: results[0]?.success ? results[0].pagination.totalItems : 0,
          good: results[1]?.success ? results[1].pagination.totalItems : 0,
          warning: results[2]?.success ? results[2].pagination.totalItems : 0,
          critical: results[3]?.success ? results[3].pagination.totalItems : 0,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard counts:", err);
      }
    };

    fetchCounts();
    return () => {
      active = false;
    };
  }, [debouncedSearch, fetchBlogs]);

  const fetchData = async (
    pageNum: number,
    healthFilter: HealthFilter,
    searchStr: string,
    sortVal = sortBy,
    dirVal = sortDirection,
    isReset = false,
  ) => {
    try {
      const res = await fetchBlogs({
        page: pageNum,
        limit: 20,
        search: searchStr,
        health: healthFilter,
        sortBy: sortVal,
        sortDirection: dirVal,
      });

      if (res && res.success) {
        if (isReset) {
          setBlogs(res.blogs || []);
        } else {
          setBlogs((prev) => [...prev, ...(res.blogs || [])]);
        }
        setHasMore(res.pagination.hasNextPage);
        setTotalItems(res.pagination.totalItems);
      }
    } catch (err) {
      console.error("Error in fetching blogs:", err);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, health, debouncedSearch, sortBy, sortDirection, false);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getScoreLabelClass = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-500";
    if (score >= 50) return "text-amber-600 dark:text-amber-500";
    return "text-rose-600 dark:text-rose-500";
  };

  const renderScoreRing = (score: number) => {
    const r = 14;
    const c = 2 * Math.PI * r;
    const off = c - (score / 100) * c;

    let strokeColor = "stroke-emerald-500";
    if (score < 50) {
      strokeColor = "stroke-rose-500";
    } else if (score < 80) {
      strokeColor = "stroke-amber-500";
    }

    return (
      <svg
        className="h-8 w-8 shrink-0 select-none"
        viewBox="0 0 36 36"
        role="img"
        aria-label={`${score} out of 100`}
      >
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          className="stroke-border"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          className={`${strokeColor} transition-all duration-500 ease-out`}
          strokeWidth="3"
          strokeDasharray={`${c.toFixed(2)}`}
          strokeDashoffset={`${off.toFixed(2)}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text
          x="18"
          y="22"
          textAnchor="middle"
          className="fill-foreground font-medium text-[9px]"
        >
          {score}
        </text>
      </svg>
    );
  };

  // Visual offsets for stacked radial bar rendering (avoids collapse of small segments)
  const visualHealthy = counts.good > 0 ? Math.max(counts.good, 12) : 0;
  const visualWarning = counts.warning > 0 ? Math.max(counts.warning, 12) : 0;
  const visualCritical =
    counts.critical > 0 ? Math.max(counts.critical, 12) : 0;

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
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-border/60">
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/75 flex items-center gap-1.5 mb-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e24b4a] animate-pulse shrink-0" />
              <span>Health Monitor</span>
            </div>
            <h1 className="text-[22px] font-medium text-foreground leading-tight tracking-tight">
              Blogs health overview
            </h1>
            <p className="text-[13px] text-muted-foreground/80 mt-1 leading-relaxed max-w-125">
              SEO compliance, quality scores, and structural health across all
              published notes.
            </p>
          </div>

          {/* Premium Radial Stacked Semi-Circle Summary Chart */}
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
                    Healthy: {" "}
                    <span className="font-semibold text-muted-foreground/80 ml-0.5">
                      ≥ 80
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#f59e0b] shrink-0" />
                  <span className="text-[12px] font-medium text-foreground">
                    Warning: {" "}
                    <span className="font-semibold text-muted-foreground/80 ml-0.5">
                      ≥ 50
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#f43f5e] shrink-0" />
                  <span className="text-[12px] font-medium text-foreground">
                    Critical: {" "}
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
                                  actualValue = counts.good;
                                  label = "Healthy";
                                  color = "rgb(16, 185, 129)";
                                } else if (nameStr === "warning") {
                                  actualValue = counts.warning;
                                  label = "Warning";
                                  color = "rgb(245, 158, 11)";
                                } else if (nameStr === "critical") {
                                  actualValue = counts.critical;
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
                      <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              const displayTotal =
                                counts.all > 0 ? counts.all : totalItems;
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
        </div>

        {/* Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              id: "all",
              label: "All blogs",
              value: "all",
              sub: "across all states",
              dotColor: null,
            },
            {
              id: "good",
              label: "Healthy · 80+",
              value: "good",
              sub: "passing threshold",
              dotColor: "bg-emerald-500",
            },
            {
              id: "warning",
              label: "Warning · 50–79",
              value: "warning",
              sub: "needs attention",
              dotColor: "bg-amber-500",
            },
            {
              id: "critical",
              label: "Critical · <50",
              value: "critical",
              sub: "action required",
              dotColor: "bg-rose-500",
            },
          ].map((filterItem) => {
            const isActive = health === filterItem.value;
            const countValue = counts[filterItem.value as keyof typeof counts];

            return (
              <button
                key={filterItem.id}
                onClick={() => setHealth(filterItem.value as HealthFilter)}
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
                  {filterItem.dotColor && (
                    <span
                      className={`inline-block w-1.25 h-1.25 rounded-full mr-1.5 shrink-0 ${filterItem.dotColor}`}
                    />
                  )}
                  {filterItem.label}
                </span>
                <div
                  className={`text-[22px] font-medium leading-none ${
                    isActive ? "text-background" : "text-foreground"
                  }`}
                >
                  {isLoadingBlogs && countValue === 0 ? (
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
                  {filterItem.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 bg-card border border-border/60 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl w-full">
            {/* Search Input */}
            <div className="relative flex-1 max-w-85 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or SEO target…"
                className="w-full pl-8 pr-2.5 py-1.5 text-[13px] rounded-md border border-border/60 bg-secondary/30 text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border focus:bg-secondary/40"
              />
            </div>

            {/* Sort Selector */}
            <SortSelector
              sortBy={sortBy}
              sortDirection={sortDirection}
              setSortBy={setSortBy}
              toggleSortDirection={toggleSortDirection}
              options={[
                { value: "seo", label: "SEO Score", icon: Award },
                { value: "created", label: "Date Created", icon: Calendar },
                { value: "updated", label: "Updated", icon: Clock },
              ]}
            />
          </div>

          <div className="text-[12px] text-muted-foreground/80 font-medium select-none shrink-0 md:text-right">
            Showing {blogs.length} of {totalItems} blogs
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-175">
              <colgroup>
                <col style={{ width: "38%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border/60 select-none">
                  <th className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/75 text-left">
                    Blog &amp; author
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/75 text-left">
                    SEO score
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/75 text-left">
                    Visibility
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/75 text-left">
                    {sortBy === "updated" ? "Updated" : "Created"}
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/75 text-right">
                    {/* Empty action column */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {blogs.length > 0 ? (
                  blogs.map((blog) => {
                    const score = blog.seoScore ?? 100;
                    const username = blog.userId?.userName || "user";
                    const collectionSlug =
                      blog.collectionId?.slug || "collection";
                    const noteSlug = blog.slug || "note";
                    const blogPath = `/${username}/${collectionSlug}/${noteSlug}`;
                    const dateToFormat =
                      sortBy === "updated" ? blog.updatedAt : blog.createdAt;
                    const formattedDate = formatTimeAgo(dateToFormat?.toString?.() ?? "")
                    
                    return (
                      <tr
                        key={blog._id}
                        onClick={() => router.push(blogPath)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(blogPath);
                          }
                        }}
                        tabIndex={0}
                        role="link"
                        className="group hover:bg-secondary/20 transition-colors duration-100 cursor-pointer focus:outline-none focus:bg-secondary/20"
                      >
                        {/* Blog & Author cell */}
                        <td className="px-3.5 py-3 align-middle max-w-sm">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {/* Avatar wrapped in tooltip */}
                            <div
                              className="shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="relative size-8 shrink-0 rounded-full overflow-hidden">
                                    {blog.userId?.avatar ? (
                                      <CloudinaryImage
                                        src={blog.userId.avatar}
                                        alt={blog.userId.fullName || "User"}
                                        fill
                                        sizes="28px"
                                        className="object-cover"
                                        loading="eager"
                                        fetchPriority="low"
                                      />
                                    ) : (
                                      getInitials(
                                        blog.userId?.fullName || "User",
                                      )
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent align="end" className="max-w-64 text-pretty">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {blog.userId?.fullName || "Anonymous"}
                                    </p>
                                    <div className="text-muted-foreground text-xs">
                                      <p>{`@${blog.userId?.userName || "anonymous"}`}</p>
                                      {blog.userId?.email && (
                                        <p>{blog.userId.email}</p>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            <div className="blog-info overflow-hidden">
                              <div className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                                {blog.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground/60 mt-0.5 flex items-center gap-1 select-none">
                                <Folder className="size-3 text-muted-foreground/50 shrink-0" />
                                <span className="truncate">
                                  {blog.collectionId?.name || "General"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SEO Score cell */}
                        <td className="px-3.5 py-3 align-middle">
                          <div className="flex items-center gap-2.5">
                            {renderScoreRing(score)}
                            <div className="flex flex-col gap-0.5 select-none">
                              <div className="text-[13px] font-medium text-foreground leading-none">
                                {score}
                              </div>
                              <div
                                className={`text-[10px] font-semibold uppercase tracking-[0.05em] leading-none ${getScoreLabelClass(score)}`}
                              >
                                {score >= 80
                                  ? "Healthy"
                                  : score >= 50
                                    ? "Warning"
                                    : "Critical"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Visibility cell */}
                        <td className="px-3.5 py-3 align-middle select-none">
                          <span
                            className={`vis-badge ${
                              blog.visibility === "public"
                                ? "text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20"
                                : "text-[11px] font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 dark:bg-rose-500/20"
                            }`}
                          >
                            {blog.visibility === "public"
                              ? "Public"
                              : "Private"}
                          </span>
                        </td>

                        {/* Created/Updated date cell */}
                        <td className="px-3.5 py-3 align-middle select-none">
                          <div className="text-xs text-muted-foreground flex items-center gap-1.25">
                            {sortBy === "updated" ? (
                              <Clock className="size-3.5 text-muted-foreground/60 shrink-0" />
                            ) : (
                              <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
                            )}
                            <span>{formattedDate}</span>
                          </div>
                        </td>

                        {/* Action cell */}
                        <td className="px-3.5 py-3 text-right align-middle pr-4">
                          <ArrowUpRight className="inline-block size-3.5 text-muted-foreground/50 transition-all duration-150 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 align-middle">
                      <div className="text-center text-muted-foreground">
                        {isLoadingBlogs ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                            <span className="text-xs">Loading blogs...</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-[14px] font-medium text-muted-foreground/80 mb-1">
                              No blogs found
                            </div>
                            <div className="text-xs text-muted-foreground/60">
                              Try adjusting your filters or search criteria.
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingBlogs}
              className="px-5 py-2 text-[13px] font-medium text-muted-foreground/80 bg-card border border-border/60 rounded-md flex items-center gap-1.5 transition-colors duration-120 hover:bg-secondary/50 hover:border-border hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoadingBlogs ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span>Load more blogs</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
