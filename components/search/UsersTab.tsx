// components/search/UsersTab.tsx
import { Clock, Trash2, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/collection/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { SearchPagination } from "./SearchPagination";
import { Searching, NotFound } from "./SearchStates";
import type { PaginationState } from "./types";
import type { IUser } from "@/types/model";
import NProgress from "nprogress";

interface UsersTabProps {
  users: IUser[];
  pagination: PaginationState;
  searchQuery: string;
  isSearching: boolean;
  isTyping: boolean;
  searchHistory: IUser[];
  onPageChange: (page: number) => void;
  onClose: () => void;
  onAddHistory: (user: IUser) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
}

function UserRow({
  user,
  onClick,
  trailing,
}: {
  user: IUser;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
    >
      <div className="relative size-8 shrink-0 rounded-full overflow-hidden bg-muted">
        <CloudinaryImage
          src={user.avatar || "/avatar.svg"}
          alt={user.fullName || "User"}
          fill
          sizes="32px"
          className="object-cover"
          loading="lazy"
          fetchPriority="low"
        />
      </div>
      <div className="flex-1">
        <p className="font-medium flex items-center gap-1.5">
          {user.fullName}
          {user.role === "admin" && (
            <BadgeIcon className="size-4 text-blue-500" />
          )}
        </p>
        <p className="text-xs text-muted-foreground">@{user.userName}</p>
      </div>
      {trailing}
    </div>
  );
}

export function UsersTab({
  users,
  pagination,
  searchQuery,
  isSearching,
  isTyping,
  searchHistory,
  onPageChange,
  onClose,
  onAddHistory,
  onRemoveHistory,
  onClearHistory,
}: UsersTabProps) {
  const router = useRouter();

  const navigate = (user: IUser) => {
    NProgress.start();
    router.push(`/${user.userName}`);
    onClose();
  };

  return (
    <>
      {/* ── Results ── */}
      {users.length === 0 ? (
        searchQuery && !isTyping ? (
          isSearching ? (
            <Searching searchQuery={searchQuery} type="users" />
          ) : (
            <NotFound searchQuery={searchQuery} type="users" />
          )
        ) : searchHistory.length === 0 ? (
          <EmptyState
            icon={<User />}
            title="Search for users"
            description="Type a name, username, or email to discover people"
            showCreateButton={false}
          />
        ) : null
      ) : (
        <>
          <div className="p-1 border-t">
            <h3 className="text-xs font-medium text-muted-foreground px-4 py-1.5">
              Results
            </h3>
            <div className="space-y-1">
              {users.map((user, index) => (
                <UserRow
                  key={user._id || index}
                  user={user}
                  onClick={() => {
                    onAddHistory(user);
                    navigate(user);
                  }}
                />
              ))}
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="border-t p-4 sticky bottom-0 bg-muted">
              <SearchPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}

      {/* ── Search history ── */}
      {searchHistory.length > 0 && (
        <>
          <Separator />
          <div className="p-1">
            <div className="flex items-center justify-between w-full px-4 py-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">
                Recent Searches
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-0.5 text-xs text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearHistory();
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>

            <div className="space-y-1">
              {searchHistory.map((user, index) => (
                <div
                  key={user._id || index}
                  onClick={() => navigate(user)}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer group"
                >
                  {/* Avatar with clock badge */}
                  <div className="relative">
                    <div className="relative size-10 shrink-0 rounded-full overflow-hidden">
                      <CloudinaryImage
                        src={user.avatar || "/avatar.svg"}
                        alt="User Profile Photo"
                        fill
                        sizes="40px"
                        className="object-cover"
                        loading="eager"
                        fetchPriority="low"
                      />
                    </div>
                    <Clock className="absolute -bottom-1 -right-1 h-4 w-4 text-muted-foreground bg-muted rounded-full p-0.5" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-1.5">
                      {user.fullName}
                      {user.role === "admin" && (
                        <BadgeIcon className="size-4 text-blue-500" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user.userName}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveHistory(user._id);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
