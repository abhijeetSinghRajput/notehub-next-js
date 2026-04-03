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

        {/* Avatar + name + bio + socials */}
        <div className="px-4 pb-6 space-y-4 sm:space-y-10">
          <div className="flex flex-col lg:flex-row items-start sm:gap-8 gap-2 lg:items-center">

            {/* Avatar */}
            <div className="relative shadow-md w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 shrink-0 border-2 sm:border-4 lg:border-8 border-card -mt-14 sm:-mt-18 lg:-mt-24 rounded-full overflow-hidden">
              <img
                src={user.avatar || "/avatar.svg"}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name + username + bio */}
            <div className="flex-1 min-w-0 mt-4">
              <h1 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                {user.fullName}
                {user.role === "admin" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4 sm:size-5 text-blue-500 shrink-0"
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

              {/* Bio */}
              {user.bio && (
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed line-clamp-3">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Socials — plain anchor tags, no client imports */}
          {user.socials?.length > 0 && (
            <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {user.socials.map((social: { url: string; _id?: string }) => (
                <a
                  key={social._id ?? social.url}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline underline-offset-4 w-max"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background">
                    {/* Globe SVG — no lucide import needed */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-3 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                    </svg>
                  </div>
                  <span className="text-sm truncate max-w-48">
                    {social.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                </a>
              ))}
            </div>
          )}
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

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{collection.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {collection.noteCount ?? collection.notes?.length ?? 0}
                      {" · Created "}
                      {new Date(collection.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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