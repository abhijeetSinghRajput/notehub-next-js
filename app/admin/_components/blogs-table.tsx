"use client";

import {
  Loader2,
  Folder,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import { formatTimeAgo } from "@/lib/utils";
import { useRouter } from "nextjs-toploader/app";

type Props = {
  blogs: any[];
  isLoading: boolean;
  hasMore: boolean;
  sortBy: string;
  onLoadMore: () => void;
};

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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
  if (score < 50)      strokeColor = "stroke-rose-500";
  else if (score < 90) strokeColor = "stroke-amber-500";

  return (
    <svg
      className="h-8 w-8 shrink-0 select-none"
      viewBox="0 0 36 36"
      role="img"
      aria-label={`${score} out of 100`}
    >
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-border" strokeWidth="3" />
      <circle
        cx="18" cy="18" r={r} fill="none"
        className={`${strokeColor} transition-all duration-500 ease-out`}
        strokeWidth="3"
        strokeDasharray={`${c.toFixed(2)}`}
        strokeDashoffset={`${off.toFixed(2)}`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="22" textAnchor="middle" className="fill-foreground font-medium text-[9px]">
        {score}
      </text>
    </svg>
  );
};

export default function BlogsTable({
  blogs,
  isLoading,
  hasMore,
  sortBy,
  onLoadMore,
}: Props) {
  const router = useRouter();

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Blog &amp; author</TableHead>
              <TableHead>SEO score</TableHead>
              <TableHead>Search Index</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>{sortBy === "updated" ? "Updated" : "Created"}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.length > 0 ? (
              blogs.map((blog) => {
                const score          = blog.seoScore ?? 100;
                const username       = blog.userId?.userName || "user";
                const collectionSlug = blog.collectionId?.slug || "collection";
                const noteSlug       = blog.slug || "note";
                const blogPath       = `/${username}/${collectionSlug}/${noteSlug}`;
                const dateToFormat   = sortBy === "updated" ? blog.contentUpdatedAt : blog.createdAt;
                const formattedDate  = formatTimeAgo(dateToFormat?.toString?.() ?? "");

                return (
                  <TableRow
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
                    {/* Blog & Author */}
                    <TableCell className="px-3.5 py-3 align-middle max-w-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                  getInitials(blog.userId?.fullName || "User")
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent align="end" className="max-w-64 text-pretty">
                              <div>
                                <p className="text-sm font-medium">{blog.userId?.fullName || "Anonymous"}</p>
                                <div className="text-muted-foreground text-xs">
                                  <p>{`@${blog.userId?.userName || "anonymous"}`}</p>
                                  {blog.userId?.email && <p>{blog.userId.email}</p>}
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
                            <span className="truncate">{blog.collectionId?.name || "General"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* SEO Score */}
                    <TableCell className="px-3.5 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        {renderScoreRing(score)}
                        <div className="flex flex-col gap-0.5 select-none">
                          <div className="text-[13px] font-medium text-foreground leading-none">{score}</div>
                          <div className={`text-[10px] font-semibold uppercase tracking-[0.05em] leading-none ${getScoreLabelClass(score)}`}>
                            {score >= 80 ? "Healthy" : score >= 50 ? "Warning" : "Critical"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Search Index */}
                    <TableCell className="px-3.5 py-3 align-middle select-none">
                      {blog.isIndexed === null || blog.isIndexed === undefined ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 dark:bg-zinc-500/20">
                          Unknown
                        </span>
                      ) : blog.isIndexed ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20">
                          Indexed
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 dark:bg-rose-500/20">
                          Not Indexed
                        </span>
                      )}
                    </TableCell>

                    {/* Visibility */}
                    <TableCell className="px-3.5 py-3 align-middle select-none">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        blog.visibility === "public"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 dark:bg-rose-500/20"
                      }`}>
                        {blog.visibility === "public" ? "Public" : "Private"}
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="px-3.5 py-3 align-middle select-none">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.25">
                        {sortBy === "updated"
                          ? <Clock className="size-3.5 text-muted-foreground/60 shrink-0" />
                          : <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
                        }
                        <span>{formattedDate}</span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="px-3.5 py-3 text-right align-middle pr-4">
                      <ArrowUpRight className="inline-block size-3.5 text-muted-foreground/50 transition-all duration-150 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 align-middle">
                  <div className="text-center text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                        <span className="text-xs">Loading blogs...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-[14px] font-medium text-muted-foreground/80 mb-1">No blogs found</div>
                        <div className="text-xs text-muted-foreground/60">Try adjusting your filters or search criteria.</div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-5 py-2 text-[13px] font-medium text-muted-foreground/80 bg-card border border-border/60 rounded-md flex items-center gap-1.5 transition-colors duration-120 hover:bg-secondary/50 hover:border-border hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
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
  );
}