"use client"

import Link from "next/link";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Plus, User2Icon, ArrowUpRight, Mail, Hash } from "lucide-react";
import Image from "next/image";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { cn } from "@/lib/utils";
import { devicons } from "@/data/dev-icons";
import { Badge } from "@/components/ui/badge";
import { IUser } from "@/types/model";

interface ProfileCardProps {
  user: IUser | null;
  onPhotoClick: (src: string) => void;
  isSelf: boolean;
}

const ProfileCard = ({ user, onPhotoClick, isSelf}: ProfileCardProps) => {
  return (
    <div>
      {/* COVER PHOTO */}
      <button
        onClick={() => user?.cover && onPhotoClick(user.cover)}
        className="group/cover relative bg-muted/30 w-full aspect-4/1 overflow-hidden cursor-zoom-in"
        aria-label="View cover photo"
      >
        <Image
          src={user?.cover || "/placeholder.svg"}
          alt="Cover"
          fill
          sizes="100vw"
          className={cn(
            "object-cover group-hover/cover:scale-105 transition-transform duration-500",
            !user?.cover && "opacity-20",
          )}
          priority
        />
        {user?.cover && (
          <div className="absolute inset-0 flex justify-center items-center bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity">
            <Plus className="size-8 text-white/80" />
          </div>
        )}
      </button>

      <div className="relative pt-0 pb-0! border-b">
        <div className="flex flex-col gap-6 px-4 pb-6">
          <div className="relative -mt-12 sm:-mt-16 w-min">
            <button
              onClick={() => user?.avatar && onPhotoClick(user.avatar)}
              className="group/avatar relative bg-muted border-4 border-background rounded-full size-24 sm:size-32 overflow-hidden cursor-zoom-in"
              aria-label="View profile photo"
            >
              <Image
                src={user?.avatar || "/avatar.svg"}
                alt={user?.fullName || "User"}
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-cover group-hover/avatar:scale-110 transition-transform"
                priority
              />
              {user?.avatar && (
                <div className="absolute inset-0 flex justify-center items-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Plus className="size-6 text-white" />
                </div>
              )}
            </button>
            {user?.role === "admin" && (
              <span className="right-1 bottom-1 absolute flex justify-center items-center bg-background p-1 rounded-full size-7">
                <BadgeIcon className="size-5 text-blue-500" />
              </span>
            )}
          </div>
          <div className="flex-1 pb-1 min-w-0">
            <CardTitle className="mb-3 font-bold text-2xl truncate">
              {user?.fullName}
            </CardTitle>
            <CardDescription className="flex flex-col space-y-2 text-base">
              <Link
                href={`/${user?.userName}`}
                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                  <User2Icon />
                </div>
                @{user?.userName}
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                  <Mail />
                </div>
                {user?.email}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
                  <Hash />
                </div>
                {user?._id}
              </div>
            </CardDescription>

            <div className="flex flex-wrap gap-2 mt-4">
              <div
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user?.isBanned ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}`}
              >
                {user?.isBanned ? "Banned" : "Active Account"}
              </div>
              {isSelf && (
                <div className="bg-purple-50 px-2.5 py-0.5 border border-purple-100 rounded-full font-bold text-[10px] text-purple-700 uppercase tracking-wider">
                  Viewing Your Profile
                </div>
              )}
            </div>

            {user?.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {user.skills.map((skill) => {
                  const devicon =
                    devicons[skill.toLowerCase() as keyof typeof devicons];
                  return (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        src={devicon?.icon || `/devicons/${skill}.svg`}
                        alt={skill}
                        width={12}
                        height={12}
                        className={cn(
                          "shrink-0",
                          devicon?.isInverted &&
                            "devicon-invertible dark:invert",
                        )}
                      />
                      <span>{skill}</span>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
