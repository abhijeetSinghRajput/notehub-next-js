"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAdminStore, type HealthFilter } from "@/app/stores/useAdminStore";
import GscIndexingCard from "./_components/gsc-indexing-card";
import HealthSummaryCard from "./_components/health-summary-card";
import HealthFilterCards from "./_components/health-filter-cards";
import BlogsControlBar from "./_components/blogs-control-bar";
import BlogsTable from "./_components/blogs-table";
import { axiosInstance } from "@/lib/axios";

function AdminOverviewContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { fetchBlogs, getBlogStats, isLoadingBlogs, isLoadingBlogStats } =
    useAdminStore();

  const getInitialHealth = (): HealthFilter => {
    const val = searchParams.get("health");
    if (val === "good" || val === "warning" || val === "critical") return val;
    return "all";
  };

  const getInitialIndexed = (): boolean | undefined => {
    const val = searchParams.get("indexed");
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  };

  const getInitialSortBy = (): string => {
    const val = searchParams.get("sortBy");
    if (val === "created" || val === "seo" || val === "updated") return val;
    return "updated";
  };

  const getInitialSortDir = (): "asc" | "desc" => {
    const val = searchParams.get("sortDirection");
    if (val === "asc" || val === "desc") return val;
    return "desc";
  };

  const initialSearch = searchParams.get("search") || "";

  const [blogs, setBlogs] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [health, setHealth] = useState<HealthFilter>(getInitialHealth);
  const [indexFilter, setIndexFilter] = useState<boolean | undefined>(
    getInitialIndexed,
  );
  const [sortBy, setSortBy] = useState(getInitialSortBy);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    getInitialSortDir,
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [gscSyncing, setGscSyncing] = useState(false);

  const [counts, setCounts] = useState({
    all: 0,
    good: 0,
    warning: 0,
    critical: 0,
  });

  const [gsc, setGsc] = useState<{
    indexed: number;
    notIndexed: number;
    lastSynced: string | null;
  }>({
    indexed: 0,
    notIndexed: 0,
    lastSynced: null,
  });

  const isInitialMount = useRef(true);

  // Sync state if searchParams change externally (e.g. browser back / forward navigation)
  useEffect(() => {
    const h = getInitialHealth();
    const i = getInitialIndexed();
    const sb = getInitialSortBy();
    const sd = getInitialSortDir();
    const s = searchParams.get("search") || "";

    if (h !== health) setHealth(h);
    if (i !== indexFilter) setIndexFilter(i);
    if (sb !== sortBy) setSortBy(sb);
    if (sd !== sortDirection) setSortDirection(sd);
    if (s !== search) {
      setSearch(s);
      setDebouncedSearch(s);
    }
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Update query parameters in URL when filter state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (health && health !== "all") {
      params.set("health", health);
    }
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (indexFilter === true) {
      params.set("indexed", "true");
    } else if (indexFilter === false) {
      params.set("indexed", "false");
    }
    if (sortBy && sortBy !== "updated") {
      params.set("sortBy", sortBy);
    }
    if (sortDirection && sortDirection !== "desc") {
      params.set("sortDirection", sortDirection);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    window.history.replaceState(null, "", newUrl);
  }, [health, debouncedSearch, sortBy, sortDirection, indexFilter, pathname]);

  useEffect(() => {
    setPage(1);
    fetchData(
      1,
      health,
      debouncedSearch,
      sortBy,
      sortDirection,
      indexFilter,
      true,
    );
    fetchStats();
  }, [health, debouncedSearch, sortBy, sortDirection, indexFilter]);

  const fetchStats = async () => {
    try {
      const res = await getBlogStats();
      if (res?.success) {
        setCounts(res.stats);
        setGsc(res.gsc);
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  };

  const fetchData = async (
    pageNum: number,
    healthFilter: HealthFilter,
    searchStr: string,
    sortVal: string,
    dirVal: "asc" | "desc",
    indexedVal: boolean | undefined,
    isReset: boolean,
  ) => {
    try {
      const res = await fetchBlogs({
        page: pageNum,
        limit: 20,
        search: searchStr,
        health: healthFilter,
        sortBy: sortVal,
        sortDirection: dirVal,
        indexed: indexedVal,
      });
      if (res?.success) {
        setBlogs((prev) => {
          const incoming = res.blogs || [];
          if (isReset) return incoming;
          const existingIds = new Set(prev.map((b) => b._id));
          return [...prev, ...incoming.filter((b) => !existingIds.has(b._id))];
        });
        setHasMore(res.pagination.hasNextPage);
        setTotalItems(res.pagination.totalItems);
      }
    } catch (err) {
      console.error("fetchData error:", err);
    }
  };

  const syncGsc = async () => {
    setGscSyncing(true);

    try {
      const { data } = await axiosInstance.get("/admin/gsc/sync");

      if (data.success) {
        await fetchStats(); // Refresh everything from the server
        // toast.success(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGscSyncing(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(
      nextPage,
      health,
      debouncedSearch,
      sortBy,
      sortDirection,
      indexFilter,
      false,
    );
  };

  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  return (
    <div className="flex p-4 max-w-7xl mx-auto flex-col gap-6">
      {/* Charts */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-border/60">
        <GscIndexingCard
          indexed={gsc.indexed}
          notIndexed={gsc.notIndexed}
          total={counts.all || totalItems}
          lastSynced={gsc.lastSynced}
          onSync={syncGsc}
          syncing={gscSyncing}
        />
        <HealthSummaryCard
          good={counts.good}
          warning={counts.warning}
          critical={counts.critical}
          total={counts.all || totalItems}
        />
      </div>

      {/* Filter Cards */}
      <HealthFilterCards
        health={health}
        counts={counts}
        isLoading={isLoadingBlogStats}
        onChange={setHealth}
      />

      {/* GSC Index Filter */}
      <div className="flex flex-col items-start gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 shrink-0">
          Search Index
        </span>
        <div className="flex gap-2">
          {[
            { label: "All", value: undefined, dot: null },
            { label: "Indexed", value: true, dot: "bg-emerald-500" },
            { label: "Not Indexed", value: false, dot: "bg-rose-500" },
          ].map((f) => {
            const isActive = indexFilter === f.value;
            return (
              <button
                key={f.label}
                onClick={() => setIndexFilter(f.value as any)}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md border transition-all duration-150 cursor-pointer select-none ${
                  isActive
                    ? "bg-foreground border-foreground text-background"
                    : "bg-card border-border/60 hover:border-border hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                {f.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.dot}`}
                  />
                )}
                {f.label}
                {f.value === true && gsc.lastSynced && (
                  <span
                    className={`ml-1 font-mono ${isActive ? "text-background/60" : "text-muted-foreground/60"}`}
                  >
                    {gsc.indexed}
                  </span>
                )}
                {f.value === false && gsc.lastSynced && (
                  <span
                    className={`ml-1 font-mono ${isActive ? "text-background/60" : "text-muted-foreground/60"}`}
                  >
                    {gsc.notIndexed}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Last synced + manual sync trigger */}
        {gsc.lastSynced ? (
          <span className="text-[10px] text-muted-foreground/40 ml-2">
            Synced {new Date(gsc.lastSynced).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40 ml-2">
            Not synced
          </span>
        )}
      </div>

      {/* Control Bar */}
      <BlogsControlBar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortDirection={sortDirection}
        setSortBy={setSortBy}
        toggleSortDirection={toggleSortDirection}
        shownCount={blogs.length}
        totalCount={totalItems}
      />

      {/* Table */}
      <BlogsTable
        blogs={blogs}
        isLoading={isLoadingBlogs}
        hasMore={hasMore}
        sortBy={sortBy}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={null}>
      <AdminOverviewContent />
    </Suspense>
  );
}

