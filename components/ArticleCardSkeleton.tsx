import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ArticleCardSkeleton() {
  return (
    <Card className="group  border-0 rounded-none screen-line-bottom screen-line-top relative flex flex-col bg-card/80 p-0 shadow-sm">
      {/* Image skeleton */}
      <div className="relative aspect-video w-full overflow-hidden">
        <Skeleton className="size-full rounded-none" />

        {/* collection badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-5.5 w-24 rounded-full" />
        </div>
      </div>

      {/* Body */}
      <CardContent className="flex flex-1 flex-col px-5 pt-4 pb-5">
        {/* Title */}
        <Skeleton className="mb-2 h-8 w-full" />

        {/* Description */}
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
        </div>

        {/* Footer row */}
        <div className="mt-4 flex items-center justify-between">
          {/* Author row */}
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="size-6 rounded-full shrink-0" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}
