import { useCallback, useEffect, useState } from "react";
import { User } from "../new/page";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/app/stores/useAuthStore";

interface RecipientSearchProps {
  selected: User[];
  onAdd: (user: User) => void;
  onRemove: (id: string) => void;
}

// ─── useDebounce ──────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

const RecipientSearch = ({
  selected,
  onAdd,
  onRemove,
}: RecipientSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const { getAllUsers } = useAuthStore();

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);

      try {
        const response = await getAllUsers({
          page: 1,
          limit: 10,
          filter: "all",
          search: q,
        });

        const filteredUsers = response.users.filter(
          (user: User) => !selected.some((s) => s._id === user._id),
        );

        setResults(filteredUsers);
      } finally {
        setSearching(false);
      }
    },
    [selected, getAllUsers],
  );

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-1.5 bg-muted py-0.5 pr-2 pl-1 rounded-full"
            >
              <div className="relative rounded-full size-5 overflow-hidden shrink-0">
                <Image
                  src={u.avatar || "/avatar.svg"}
                  alt={u.fullName}
                  fill
                  sizes="20px"
                  className="object-cover"
                />
              </div>
              <span className="font-medium text-xs">{u.fullName}</span>
              <button
                onClick={() => onRemove(u._id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="top-1/2 left-2.5 absolute w-4 h-4 text-muted-foreground -translate-y-1/2" />
        <Input
          className="pr-8 pl-8"
          placeholder="Search by name, username or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {(query || searching) && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="top-1/2 right-2.5 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
        {results.length > 0 && (
          <div className="top-[calc(100%+4px)] z-50 absolute bg-background shadow-lg border rounded-md w-full max-h-52 overflow-y-auto">
            {results.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  onAdd(user);
                  setQuery("");
                  setResults([]);
                }}
                className="flex items-center gap-2.5 hover:bg-muted px-3 py-2 cursor-pointer"
              >
                <div className="relative rounded-full size-8 overflow-hidden shrink-0">
                  <Image
                    src={user.avatar || "/avatar.svg"}
                    alt={user.fullName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{user.fullName}</p>
                  <p className="text-muted-foreground text-xs">
                    @{user.userName} · {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientSearch;
