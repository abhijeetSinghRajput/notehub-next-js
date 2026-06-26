import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ArticleCardSkeleton() {
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-none border-border/60 bg-card/80 p-0 shadow-sm">
      {/* Image skeleton */}
      <div className="relative aspect-video w-full overflow-hidden">
        <Skeleton className="size-full rounded-none" />

        {/* collection badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Body */}
      <CardContent className="flex flex-1 flex-col px-5 pt-4 pb-5">

        {/* Author row */}
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="size-6 rounded-full shrink-0" />
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Title */}
        <Skeleton className="mb-2 h-5 w-4/5" />
        <Skeleton className="mb-1 h-5 w-3/5" />

        {/* Description */}
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
        </div>

        {/* Footer row */}
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}