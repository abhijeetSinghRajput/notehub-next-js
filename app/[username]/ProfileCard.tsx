"use client";;
import { cn } from "@/lib/utils";
import { ChevronRight, LinkIcon, Pencil, Quote } from "lucide-react";
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
  isAdmin: boolean;
  profileShareLink: string;
  onImageClick: (src: string) => void;
}

const ProfileCard = ({
  user,
  isOwner,
  isAdmin,
  profileShareLink,
  onImageClick,
}: ProfileCardProps) => {
  const canEdit = isOwner || isAdmin;
  const editHref = isOwner
    ? "/settings/profile"
    : `/settings/profile?username=${user.userName}`;

  const hasBio = Boolean(user.bio?.trim());
  const hasSocials = Boolean(user.socials?.length);

  return (
    <Card className="max-w-3xl mx-auto overflow-hidden shadow-sm">
      {/* Cover */}
      <div
        className="relative rounded-none max-h-48 h-full w-full overflow-hidden cursor-pointer"
        style={{ aspectRatio: "3/1" }}
        onClick={() => onImageClick(user.cover || "/placeholder.svg")}
      >
        <CloudinaryImage
          src={user.cover || "/placeholder.svg"}
          alt="User cover photo"
          fill
          sizes="100vw"
          className={cn("object-cover", !user.cover && "opacity-30")}
          preload
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <CardContent>
        <div className="flex flex-col lg:flex-row items-start lg:items-center">
          {/* Avatar */}
          <div
            className="relative mr-8 shadow-md w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 shrink-0 border-4 sm:border-6 lg:border-8 border-card -mt-14 sm:-mt-18 lg:-mt-24 rounded-full overflow-hidden cursor-pointer"
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

                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <TooltipWrapper
                      message={isOwner ? "Edit Profile" : "Edit as Admin"}
                    >
                      <Link
                        href={editHref}
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
              {hasBio && (
                <p className="text-sm mt-2 leading-relaxed line-clamp-3">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Socials */}
        {hasSocials && (
          <ProfileSocials
            socials={user.socials}
            className="mt-4 md:mt-10"
          />
        )}

        {!hasBio && canEdit && (
          <EmptyProfileBlock
            icon={<Quote className="size-4" />}
            title="Add a short bio"
            description="Tell people what you do, what you’re learning, or what you like building."
            href={editHref}
            className="mt-4"
          />
        )}
        {!hasSocials && canEdit && (
          <EmptyProfileBlock
            icon={<LinkIcon className="size-4" />}
            title="Add social links"
            description="Connect GitHub, LinkedIn, X, portfolio, or other platforms so people can explore your work."
            href={editHref}
          />
        )}
      </CardContent>
    </Card>
  );
};

type EmptyProfileBlockProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  className?: string;
};

function EmptyProfileBlock({
  icon,
  title,
  description,
  href,
  className,
}: EmptyProfileBlockProps) {
  return (
    <Link
      href={href}
      className={cn("group flex items-start gap-4 p-4 hover:bg-muted/40 transition-colors", className)}
    >
      {icon}
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
    </Link>
  );
}

export default ProfileCard;
