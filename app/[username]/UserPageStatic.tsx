// app/[username]/UserPageStatic.tsx
// NO "use client" — pure server HTML for crawlers and no-JS users

import Link from "next/link";

export default function UserPageStatic({
  user,
  collections = [],
}: {
  user: any;
  collections?: any[];
}) {
  if (!user) return null;

  return (
    <div id="static-profile" className="p-4">

      {/* ── Profile Card ── */}
      <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border shadow-sm">

        {/* Cover photo */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/1" }}>
          <img
            src={user.cover || "/profile-cover.svg"}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Avatar + name row */}
        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:gap-8 gap-2 sm:items-center">

            {/* Avatar */}
            <div className="relative shadow-md w-28 h-28 sm:w-48 sm:h-48 shrink-0 border-4 sm:border-8 border-background -mt-14 rounded-full overflow-hidden">
              <img
                src={user.avatar || "/avatar.svg"}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name + username */}
            <div className="flex justify-between w-full items-start gap-2">
              <div>
                <h1 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                  {user.fullName}
                  {user.role === "admin" && (
                    /* Blue verified badge — inline SVG so no client import needed */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-4 sm:size-5 text-blue-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  @{user.userName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Collections ── */}
      {collections.length > 0 && (
        <div className="max-w-3xl mx-auto mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Collections</h2>
              <p className="text-sm text-muted-foreground">
                {collections.length}{" "}
                {collections.length === 1 ? "collection" : "collections"}
              </p>
            </div>
          </div>

          <div className="space-y-0 divide-y divide-border">
            {collections.map((collection: any) => {
              const collectionHref = `/${user.userName}/${collection.slug}`;
              return (
                <Link
                  key={collection._id}
                  href={collectionHref}
                  className="flex items-center gap-4 py-4 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                >
                  {/* Icon */}
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{collection.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {collection.noteCount ?? collection.notes?.length ?? 0}
                      {" · Created "}
                      {new Date(collection.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}