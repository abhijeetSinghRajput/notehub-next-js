// app/[username]/UserPageStatic.tsx
// NO "use client" — pure server HTML for crawlers and no-JS users

import Link from "next/link";

// Mirrors getPlatformIcon + getUsernameFromUrl without client imports
function getStaticPlatformMeta(url: string): { username: string; iconPath: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const parts = u.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] ?? host;

    // Match the most common platforms with their icons
    if (host.includes("github.com"))
      return { username: slug, iconPath: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" };
    if (host.includes("twitter.com") || host.includes("x.com"))
      return { username: slug, iconPath: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" };
    if (host.includes("linkedin.com"))
      return { username: slug, iconPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" };
    if (host.includes("youtube.com"))
      return { username: slug, iconPath: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" };
    if (host.includes("instagram.com"))
      return { username: slug, iconPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" };

    // Globe fallback
    return { username: url.replace(/^https?:\/\/(www\.)?/, ""), iconPath: "" };
  } catch {
    return { username: url, iconPath: "" };
  }
}

function PlatformIcon({ iconPath }: { iconPath: string }) {
  if (!iconPath) {
    // Globe SVG — matches the lucide Globe used as fallback
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-3 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={iconPath} />
    </svg>
  );
}

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

      {/* ── Profile Card — mirrors <Card> + <CardContent> ── */}
      <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">

        {/* Cover — same aspect + overflow as dynamic */}
        <div className="relative rounded-none max-h-48 h-full w-full overflow-hidden" style={{ aspectRatio: "3/1" }}>
          <img
            src={user.cover || "/placeholder.svg"}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* CardContent — matches dynamic padding */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center">

            {/* Avatar — identical sizing + border + negative margin */}
            <div className="relative mr-8 shadow-md w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 shrink-0 border-4 sm:border-6 lg:border-8 border-card -mt-14 sm:-mt-18 lg:-mt-24 rounded-full overflow-hidden">
              <img
                src={user.avatar || "/avatar.svg"}
                alt="User avatar"
                className="w-full h-full object-cover"
                loading="lazy"
                fetchPriority="low"
              />
            </div>

            {/* Name + actions row */}
            <div className="flex justify-between mt-4 w-full items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                      {user.fullName}
                      {user.role === "admin" && (
                        // BadgeIcon inline — verified checkmark badge
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0 sm:size-5 text-blue-500">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      )}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      @{user.userName}
                    </p>
                  </div>
                  {/* No edit/share buttons in static — owner-only client actions */}
                </div>

                {/* Bio */}
                {user.bio?.trim() && (
                  <p className="text-sm mt-2 leading-relaxed line-clamp-3">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Socials — mirrors ProfileSocials layout exactly */}
          {user.socials?.length > 0 && (
            <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 mt-4 md:mt-10">
              {user.socials.map((social: { url: string; _id?: string }) => {
                const { username, iconPath } = getStaticPlatformMeta(social.url);
                return (
                  <a
                    key={social._id ?? social.url}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline underline-offset-4 w-max"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors">
                      <PlatformIcon iconPath={iconPath} />
                    </div>
                    <div className="text-sm">{username}</div>
                  </a>
                );
              })}
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
            {collections.map((collection: any) => (
              <Link
                key={collection._id}
                href={`/${user.userName}/${collection.slug}`}
                className="flex items-center gap-4 py-4 hover:bg-muted/30 px-2 rounded-lg transition-colors"
              >
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}