import React, { useEffect } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SidebarSearchProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onSearch: (value: string) => void;
  defaultValue?: string;
}

export function SidebarSearch({
  inputRef,
  onSearch,
  defaultValue = "",
}: SidebarSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState<string>(defaultValue);

  // Sync with parent's onSearch
  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  useEffect(() => {
    if (inputRef?.current) {
      (inputRef.current as HTMLInputElement).focus();
    }
  }, [inputRef]);

  return (
    <div className="relative w-full">
      <Label htmlFor="search" className="sr-only">
        Search notes
      </Label>
      <Input
        ref={inputRef}
        id="search"
        placeholder="Search notes..."
        className="text-sm pl-8 h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}