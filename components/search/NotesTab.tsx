// components/search/NotesTab.tsx
import { Search, Folder } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/collection/EmptyState";
import CloudinaryImage from "@/components/ui/cloudinary-image";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { SearchPagination } from "./SearchPagination";
import { Searching, NotFound } from "./SearchStates";
import type { PaginationState } from "./types";
import type { PopulatedNote } from "@/types/model";
import NProgress from "nprogress";

interface NoteWithSnippets extends PopulatedNote {
  snippets: React.ReactNode[];
}

interface NotesTabProps {
  notes: NoteWithSnippets[];
  pagination: PaginationState;
  searchQuery: string;
  isSearching: boolean;
  isTyping: boolean;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export function NotesTab({
  notes,
  pagination,
  searchQuery,
  isSearching,
  isTyping,
  onPageChange,
  onClose,
}: NotesTabProps) {
  const router = useRouter();

  if (notes.length === 0) {
    if (searchQuery && !isTyping) {
      return isSearching ? (
        <Searching searchQuery={searchQuery} type="notes" />
      ) : (
        <NotFound searchQuery={searchQuery} type="notes" />
      );
    }
    return (
      <EmptyState
        icon={<Search />}
        title="Search for notes"
        description="Type to discover notes"
        showCreateButton={false}
      />
    );
  }

  return (
    <div className="border-t">
      <h3 className="text-xs font-medium text-muted-foreground px-4 py-1.5">
        Results
      </h3>

      <div>
        {notes.map((note, index) => {
          const author = note.userId;
          const collection = note.collectionId;

          return (
            <div
              key={note._id || index}
              className="flex border-b border-primary/20 hover:bg-primary/10 items-start gap-3 p-2 px-4 group cursor-pointer"
              onClick={() => {
                NProgress.start();
                const finalSlug = note.seo?.slug || note.slug;
                router.push(
                  `/${author?.userName}/${collection?.slug}/${finalSlug}`,
                );
                onClose();
              }}
            >
              <div className="flex-1 space-y-3">
                <div className="w-full min-w-0">
                  <p className="line-clamp-1 font-medium text-lg">
                    {note.name}
                  </p>
                  <p className="text-primary/70 text-sm line-clamp-3">
                    {note.snippets}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex gap-1 items-center">
                    <Folder
                      className="text-muted-foreground fill-muted-foreground"
                      size={14}
                    />
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {collection?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="relative size-4 shrink-0 rounded-full overflow-hidden bg-muted">
                        <CloudinaryImage
                          src={author?.avatar || "/avatar.svg"}
                          alt={author?.fullName || "Author"}
                          fill
                          sizes="16px"
                          className="object-cover"
                          loading="lazy"
                          fetchPriority="low"
                        />
                      </div>
                      <span>{author?.fullName}</span>
                      {author?.role === "admin" && (
                        <BadgeIcon className="size-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
