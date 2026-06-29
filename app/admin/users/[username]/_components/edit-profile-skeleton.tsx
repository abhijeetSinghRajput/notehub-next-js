import { Skeleton } from "@/components/ui/skeleton";

const EditProfileSkeleton = () => {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="border-x">
        {/* Profile Header Skeleton */}
        <ProfileCardSkeleton />

        {/* Basic Info Section */}
        <div>
          <div className="stripe-divider" />
          <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
            Basic Info
          </h2>

          <div className="px-4 py-6 screen-line-bottom">
            <div className="gap-4 grid sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" /> {/* Label */}
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" /> {/* Label */}
                <Skeleton className="h-9 w-full" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" /> {/* Label */}
                <Skeleton className="h-3 w-8" /> {/* Character count */}
              </div>
              <Skeleton className="h-16 w-full border" />
            </div>

            <Skeleton className="mt-4 h-16 w-full" />
          </div>

          {/* Social Links Section */}
          <div className="stripe-divider" />
          <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
            SOCIAL LINKS
          </h2>

          <div className="space-y-4 px-4 py-6 screen-line-bottom">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in"
              >
                <Skeleton className="flex-1 bg-muted/30 h-9 pl-9" />
                <Skeleton className="h-9 w-9 shrink-0" />
              </div>
            ))}

            <Skeleton className="h-9 w-32 border-dashed" />
          </div>

          {/* Account Settings Section */}
          <div className="stripe-divider" />
          <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
            ACCOUNT SETTINGS
          </h2>

          <div className="screen-line-top px-4 py-6">
            <div className="gap-4 grid grid-cols-2">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" /> {/* Label */}
                <Skeleton className="h-10 w-full bg-muted/30" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-28" /> {/* Label */}
                <Skeleton className="h-10 w-full bg-muted/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileCardSkeleton = () => {
  return (
    <div>
      {/* COVER PHOTO SKELETON */}
      <Skeleton className="w-full h-full aspect-4/1 rounded-none" />

      <div className="relative pt-0 pb-0! border-b">
        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* Avatar and Badge Section */}
          <div className="relative -mt-12 sm:-mt-16 w-min">
            <div className="relative bg-muted border-4 border-background rounded-full size-24 sm:size-32 overflow-hidden">
              <Skeleton className="w-full h-full rounded-full" />
            </div>
            {/* Admin Badge Skeleton */}
            <div className="right-1 bottom-1 absolute flex justify-center items-center bg-background p-1 rounded-full size-7">
              <Skeleton className="size-5 rounded-full" />
            </div>
          </div>

          <div className="flex-1 pb-1 min-w-0">
            {/* Full Name */}
            <Skeleton className="mb-3 h-8 w-48" />

            <div className="flex flex-col space-y-2 text-base">
              {/* Username */}
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 shrink-0 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>

              {/* Email */}
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 shrink-0 rounded-lg" />
                <Skeleton className="h-5 w-48" />
              </div>

              {/* User ID */}
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 shrink-0 rounded-lg" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-full" />
            </div>

            {/* Skills Section */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {[...Array(5)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-6 w-16 rounded-md shrink-0"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileSkeleton;
