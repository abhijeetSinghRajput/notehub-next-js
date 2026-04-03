"use client";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import TooltipWrapper from "@/components/TooltipWrapper";
import BadgeIcon from "@/components/icons/BadgeIcon";
import SharePopoverWrapper from "@/components/ShareNotePopover.client";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import { IUser } from "@/types/model";
import ProfileSocials from "./ProfileSocials";

interface ProfileCardProps {
  user: IUser;
  isOwner: boolean;
  profileShareLink: string;
  onImageClick: (src: string) => void;
}

const ProfileCard = ({
  user,
  isOwner,
  profileShareLink,
  onImageClick,
}: ProfileCardProps) => {
  return (
    <Card className="max-w-3xl mx-auto overflow-hidden shadow-sm">
      {/* Cover */}
      <div
        className="relative rounded-none max-h-48 h-full w-full overflow-hidden cursor-pointer"
        style={{ aspectRatio: "3/1" }}
        onClick={() => onImageClick(user.cover || "/profile-cover.svg")}
      >
        <CloudinaryImage
          src={user.cover || "/profile-cover.svg"}
          alt="User cover photo"
          fill
          sizes="100vw"
          className="object-cover"
          preload
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <CardContent className="space-y-4 md:space-y-10">
        <div className="flex flex-col lg:flex-row items-start sm:gap-8 gap-2 lg:items-center">
          {/* Avatar */}
          <div
            className="relative shadow-md w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 shrink-0 border-4 sm:border-6 lg:border-8 border-card -mt-14 sm:-mt-18 lg:-mt-24 rounded-full overflow-hidden cursor-pointer"
            onClick={() => onImageClick(user.avatar || "/avatar.svg")}
            role="button"
            aria-label="View profile photo"
          >
            <CloudinaryImage
              src={user.avatar || "/avatar.svg"}
              alt="User avatar"
              fill
              sizes="(max-width: 640px) 112px, 192px"
              className="object-cover"
              loading="lazy"
              fetchPriority="low"
            />
          </div>

          {/* Name + actions */}
          <div className="flex justify-between mt-4 w-full items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                    {user.fullName}
                    {user.role === "admin" && (
                      <BadgeIcon className="size-4 shrink-0 sm:size-5 text-blue-500" />
                    )}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    @{user.userName}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOwner && (
                    <TooltipWrapper message="Edit Profile">
                      <Link
                        href="/settings/profile"
                        aria-label="Edit profile"
                        className="hover:bg-muted rounded-full size-10 flex justify-center items-center"
                      >
                        <Pencil size={18} />
                      </Link>
                    </TooltipWrapper>
                  )}
                  <SharePopoverWrapper
                    shareLink={profileShareLink}
                    triggerVariant="ghost"
                  />
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-sm mt-2 leading-relaxed line-clamp-3">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Socials */}
        {!!user.socials?.length && <ProfileSocials socials={user.socials} />}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
