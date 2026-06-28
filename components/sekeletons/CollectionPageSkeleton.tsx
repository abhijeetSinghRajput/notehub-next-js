import React from "react";
import { Card } from "@/components/ui/card";

const CollectionPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col gap-8 animate-pulse">
        {/* Header Section Skeleton */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar Skeleton */}
              <div className="h-16 w-16 rounded-full bg-muted" />

              {/* Name/Username Skeleton */}
              <div className="space-y-2">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>

            {/* Collection Title/Description Skeleton */}
            <CollaboratorsSkeleton />
            <div className="h-8 w-48 bg-muted rounded" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-9 w-36 rounded-xl bg-muted" />
          <div className="h-9 w-9 rounded-xl bg-muted" />
        </div>


        {/* Notes Grid Skeleton */}
        <div className="screen-line-top border-x relative py-6">
          <div
            className="pointer-events-none absolute inset-0  grid gap-6 sm:gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            <div className="border-r" />
            <div className="border-x" />
            <div className="border-l" />
          </div>

          <section
            className="scroll-mt-20 grid gap-6 sm:gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            }}
          >
            {[...Array(12)].map((_, index) => (
              <ArticleCardSkeleton key={index} />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCardSkeleton } from "../ArticleCardSkeleton";

const CollaboratorsSkeleton = () => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Avatars */}
      <div className="flex items-center gap-3">
        <div className="flex flex-row-reverse">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="h-10 w-10 bg-muted opacity-100 rounded-full border-2 -mr-3 border-background shadow-md"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionPageSkeleton;
