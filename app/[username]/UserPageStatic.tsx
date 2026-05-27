// app/[username]/UserPageStatic.tsx
// NO "use client" — pure server HTML for crawlers and no-JS users

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { devicons } from "@/data/dev-icons";
import { ArrowUpRight } from "lucide-react";

import { getPlatformIcon, GetPlatformName, getUsernameFromUrl } from "@/lib/platform";

const CELL_SIZE = 10;
const CELL_GAP = 3;
const STEP = CELL_SIZE + CELL_GAP;
const MONTH_LABEL_HEIGHT = 20;
const COLORS_LIGHT = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

function getLevel(count: number) {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

function StaticContributionGraph({ githubData }: { githubData: any }) {
  const weeks: { contributionDays: { date: string; contributionCount: number }[] }[] =
    githubData?.weeks ?? [];
  const totalContributions: number = githubData?.totalContributions ?? 0;
  const ghUsername: string = githubData?.username ?? "";

  if (!weeks.length) return null;

  // Build month labels
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        x: wi * STEP,
        label: new Date(firstDay.date).toLocaleString("default", { month: "short" }),
      });
      lastMonth = month;
    }
  });

  const svgWidth = weeks.length * STEP;
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * STEP;

  return (
    <>
      <div className="flex justify-between items-center gap-8 mb-2">
        <p className="mb-2 text-muted-foreground text-xs">
          <span className="font-medium text-foreground">
            {totalContributions.toLocaleString()}
          </span>{" "}
          contributions in the last year
        </p>
      </div>
      <div className="w-full">
        <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
          {monthLabels.map(({ x, label }, i) => (
            <text key={i} x={x} y={12} fontSize={10} fill="#57606a" fontFamily="monospace">
              {label}
            </text>
          ))}
          {weeks.map((week, wi) =>
            week.contributionDays.map((day) => {
              const x = wi * STEP;
              const y = MONTH_LABEL_HEIGHT + week.contributionDays.indexOf(day) * STEP;
              return (
                <rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  fill={COLORS_LIGHT[getLevel(day.contributionCount)]}
                >
                  <title>
                    {day.contributionCount === 0
                      ? `No contributions on ${day.date}`
                      : `${day.contributionCount} contributions on ${day.date}`}
                  </title>
                </rect>
              );
            })
          )}
        </svg>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          {ghUsername && (
            <a
              href={`https://github.com/${ghUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              {ghUsername}
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 duration-200" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="text-muted-foreground text-xs">Less</span>
          {COLORS_LIGHT.map((c, i) => (
            <div key={i} className="rounded-[2px] size-2 sm:size-3" style={{ backgroundColor: c }} />
          ))}
          <span className="text-muted-foreground text-xs">More</span>
        </div>
      </div>
    </>
  );
}

export default function UserPageStatic({
  user,
  collections = [],
  githubData,
}: {
  user: any;
  collections?: any[];
  githubData?: any;
}) {
  if (!user) return null;

  return (
    <div id="static-profile" className="p-4">

      {/* ── Profile Card — mirrors <Card> + <CardContent> ── */}
      <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">

        {/* Cover — same aspect + overflow as dynamic */}
        <div className="relative rounded-none w-full aspect-4/1 overflow-hidden">
          <img
            src={user.cover || "/placeholder.svg"}
            alt="Cover photo"
            className={`w-full h-full object-cover${!user.cover ? " opacity-30" : ""}`}
          />
        </div>

        {/* CardContent — matches dynamic padding */}
        <div className="p-6 pt-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center">

            {/* Avatar — identical sizing + border + negative margin */}
            <div className="relative mr-8 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 shrink-0 border-4 sm:border-6 lg:border-8 border-card -mt-14 sm:-mt-18 lg:-mt-24 rounded-full overflow-hidden">
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-label="Verified"
                          className="size-4 shrink-0 sm:size-5 text-blue-500"
                        >
                          <path d="M24 12a4.454 4.454 0 0 0-2.564-3.91 4.437 4.437 0 0 0-.948-4.578 4.436 4.436 0 0 0-4.577-.948A4.44 4.44 0 0 0 12 0a4.423 4.423 0 0 0-3.9 2.564 4.434 4.434 0 0 0-2.43-.178 4.425 4.425 0 0 0-2.158 1.126 4.42 4.42 0 0 0-1.12 2.156 4.42 4.42 0 0 0 .183 2.421A4.456 4.456 0 0 0 0 12a4.465 4.465 0 0 0 2.576 3.91 4.433 4.433 0 0 0 .936 4.577 4.459 4.459 0 0 0 4.577.95A4.454 4.454 0 0 0 12 24a4.439 4.439 0 0 0 3.91-2.563 4.26 4.26 0 0 0 5.526-5.526A4.453 4.453 0 0 0 24 12Zm-13.709 4.917-4.38-4.378 1.652-1.663 2.646 2.646L15.83 7.4l1.72 1.591-7.258 7.926Z" />
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

                {/* Skills & Tools */}
                {user.skills && user.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {user.skills.map((skill: string) => {
                      const devicon = devicons[skill.toLowerCase() as keyof typeof devicons];
                      return (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="h-6 rounded-md transition-all duration-200 shrink-0 gap-1.5"
                        >
                          <img 
                            src={devicon?.icon || `/devicons/${skill}.svg`} 
                            alt={skill} 
                            width={14} 
                            height={14}
                            className={`shrink-0${devicon?.isInverted ? " devicon-invertible dark:invert" : ""}`}
                          />
                          <span className="capitalize">{skill}</span>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Socials — mirrors ProfileSocials layout exactly */}
          {user.socials?.length > 0 && (
            <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 mt-4 md:mt-10">
              {user.socials.map((social: { url: string; _id?: string }) => {
                const platformName = GetPlatformName(social.url);
                const PlatformIcon = getPlatformIcon(social.url);
                const username = getUsernameFromUrl(social.url, platformName);

                return (
                  <a
                    key={social._id ?? social.url}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline underline-offset-4 w-max"
                  >
                    <div
                      className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3"
                    >
                      <PlatformIcon />
                    </div>
                    <div className="text-sm">{username}</div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── GitHub Contributions ── */}
      {githubData?.weeks?.length > 0 && (
        <div className="max-w-3xl mx-auto mt-8">
          <StaticContributionGraph githubData={githubData} />
        </div>
      )}

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