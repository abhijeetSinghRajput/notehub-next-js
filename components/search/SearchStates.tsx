// components/search/SearchStates.tsx
import { Ghost, Search } from "lucide-react";

interface SearchStateProps {
  searchQuery?: string;
  type?: string;
}

export function Searching({ searchQuery = "", type = "notes" }: SearchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-6 animate-pulse">
      <div className="bg-primary/20 rounded-full p-5">
        <Search className="h-10 w-10 stroke-1.5 text-muted-foreground/80" />
      </div>
      <div className="text-center space-y-1 max-w-md px-4">
        <h3 className="text-xl font-medium tracking-tight">
          {`Searching for ${type}`}
        </h3>
        <p className="text-muted-foreground">{searchQuery}</p>
      </div>
      <p className="text-sm text-muted-foreground/60">
        Try different keywords or check spelling
      </p>
    </div>
  );
}

export function NotFound({ searchQuery = "", type = "notes" }: SearchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-6">
      <div className="bg-primary/20 rounded-full p-5 animate-pulse">
        <Ghost className="h-10 w-10 stroke-1.5 text-muted-foreground/80" />
      </div>
      <div className="text-center space-y-1 max-w-md px-4">
        <h3 className="text-xl font-medium tracking-tight">
          {searchQuery ? "No results found" : `Search for ${type}`}
        </h3>
        <p className="text-muted-foreground">
          {searchQuery
            ? `No ${type} found for "${searchQuery}"`
            : type === "notes"
              ? "Type to discover notes"
              : "Type a name, username, or email to discover people"}
        </p>
      </div>
      <p className="text-sm text-muted-foreground/60">
        Try different keywords or check spelling
      </p>
    </div>
  );
}