import Image from "next/image";
import { IUser } from "@/types/model";
import TooltipWrapper from "./TooltipWrapper";
import { cn } from "@/lib/utils";

type AvatarStackProps = {
  collaborators?: IUser[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
};

const sizeConfig = {
  sm: { px: 24,  avatar: "h-6 w-6",  text: "text-[10px]", margin: "-mr-1.5", border: "border" },
  md: { px: 32,  avatar: "h-8 w-8",  text: "text-xs",     margin: "-mr-3",   border: "border-2" },
  lg: { px: 40,  avatar: "h-10 w-10", text: "text-sm",    margin: "-mr-3",   border: "border-2" },
};

const AvatarStack = ({
  collaborators = [],
  maxVisible = 5,
  size = "md",
}: AvatarStackProps) => {
  if (collaborators.length === 0) return null;

  const visibleAvatars = Math.min(collaborators.length, maxVisible);
  const hiddenCount = Math.max(collaborators.length - maxVisible, 0);
  const current = sizeConfig[size] ?? sizeConfig.md;
  const sizesAttr = `${current.px}px`;

  return (
    <div className="flex flex-row-reverse">
      {/* Overflow avatar (+N) */}
      {hiddenCount > 0 && (
        <TooltipWrapper
          message={`${hiddenCount} more collaborator${hiddenCount > 1 ? "s" : ""}`}
        >
          <div
            className={cn(
              "relative shadow-md rounded-full overflow-hidden shrink-0",
              current.avatar,
              current.border,
              current.margin,
              "border-background",
            )}
          >
            <Image
              src={collaborators[maxVisible]?.avatar || "/avatar.svg"}
              alt="Collaborator Profile Photo"
              fill
              sizes={sizesAttr}
              className="object-cover"
              loading="lazy"
              fetchPriority="low"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <span className={cn("text-white font-medium", current.text)}>
                +{hiddenCount}
              </span>
            </div>
          </div>
        </TooltipWrapper>
      )}

      {/* Visible collaborator avatars */}
      {collaborators
        .slice(0, visibleAvatars)
        .reverse()
        .map((collaborator, index) => (
          <TooltipWrapper
            key={collaborator._id ? String(collaborator._id) : index}
            message={`@${collaborator.userName ?? ""}`}
          >
            <div
              className={cn(
                "relative shadow-md rounded-full overflow-hidden shrink-0",
                current.avatar,
                current.border,
                current.margin,
                "border-background bg-muted",
              )}
            >
              {collaborator.avatar ? (
                <Image
                  src={collaborator.avatar}
                  alt={collaborator.fullName || "Collaborator Profile Photo"}
                  fill
                  sizes={sizesAttr}
                  className="object-cover"
                  loading="lazy"
                  fetchPriority="low"
                />
              ) : (
                // Fallback initials
                <div
                  className={cn(
                    "flex size-full items-center justify-center bg-muted font-medium",
                    current.text,
                  )}
                >
                  {collaborator.fullName?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
            </div>
          </TooltipWrapper>
        ))}
    </div>
  );
};

export default AvatarStack;