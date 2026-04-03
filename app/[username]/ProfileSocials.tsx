"use client";
import {
  getPlatformIcon,
  GetPlatformName,
  getUsernameFromUrl,
} from "@/lib/platform";

interface ProfileSocialsProps {
  socials: { url: string; _id?: string }[];
}

const ProfileSocials = ({ socials }: ProfileSocialsProps) => {
  if (!socials?.length) return null;

  return (
    <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
      {socials.map((social, i) => {
        const platformName = GetPlatformName(social.url);
        const PlatformIcon = getPlatformIcon(social.url);

        return (
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={platformName}
            className="flex items-center gap-2 hover:underline underline-offset-4 w-max"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-3">
              <PlatformIcon />
            </div>
            <div className="text-sm">{getUsernameFromUrl(social.url, platformName)}</div>
          </a>
        );
      })}
    </div>
  );
};

export default ProfileSocials;
