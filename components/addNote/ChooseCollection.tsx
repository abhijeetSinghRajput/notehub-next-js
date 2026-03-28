import { ChevronRight, FolderPlus, Lock, PackageOpen } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AvatarStack from "../CollaboratorAvatars";
import { useNoteStore } from "@/app/stores/useNoteStore";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import FolderPlusIcon from "../icons/FolderPlusIcon";
import { ICollection, IUser } from "@/types/model";

interface ChooseCollectionProps {
  setActiveTab: (tab: string) => void;
  setSelectedCollection: (collection: ICollection) => void;
}

const ChooseCollection: React.FC<ChooseCollectionProps> = ({
  setActiveTab,
  setSelectedCollection,
}) => {
  const { collections } = useNoteStore();

  const handleCollectionSelect = (collection: ICollection) => {
    setSelectedCollection(collection);
    setActiveTab("add-note");
  };

  return (
    <Command className="mx-auto flex h-full min-h-0 max-w-3xl flex-col rounded-none bg-transparent">
      <div className="shrink-0 py-4">
        <CommandInput
          wrapperClassName={cn("gap-3 border-none", collections?.length === 0 && "hidden")}
          iconClassName="hidden"
          className="flex h-10 w-full my-2 rounded-lg border ring-offset-1 ring-offset-background border-input bg-muted/20 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          placeholder="Search Collection..."
          autoFocus
        >
          <Button
            className="h-10"
            onClick={() => setActiveTab("create-collection")}
          >
            <FolderPlus /> New Collection
          </Button>
        </CommandInput>
      </div>

      <CommandList className="flex-1 overflow-y-auto max-h-none">
        <CommandEmpty>
          <div className="flex  flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4 flex items-center justify-center rounded-full bg-muted/30 p-6">
              <PackageOpen
                className="h-12 w-12 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              No collections found
            </h3>
            <p className="mb-6 max-w-sm text-base text-muted-foreground">
              Get started by creating your first collection to organize your
              notes.
            </p>
            <Button
              onClick={() => setActiveTab("create-collection")}
              variant="default"
              className="gap-2 h-10 rounded-lg"
            >
              <FolderPlus className="h-4 w-4" />
              Create Collection
            </Button>
          </div>
        </CommandEmpty>
        <CommandGroup
          heading={collections?.length === 0 ? "" : "Collections"}
          className="**:[[cmdk-group-heading]]:text-lg"
        >
          {collections.map((collection) => (
            <CommandItem
              key={collection._id}
              value={collection.name}
              onSelect={() => handleCollectionSelect(collection)}
              className="group flex cursor-pointer items-center gap-4 border-b p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
            >
              <FolderPlusIcon className="size-12 opacity-70" />

              <div className="flex-1">
                <h4 className="font-semibold group-hover:text-primary">
                  {collection.name}
                </h4>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {collection.notes?.length} notes
                    </Badge>
                    {collection.visibility === "private" && (
                      <Badge
                        variant="destructive"
                        className="size-5 p-0 flex items-center justify-center"
                      >
                        <Lock strokeWidth={3} size={15} />
                      </Badge>
                    )}
                  </div>
                  {collection.collaborators?.length ? (
                    <AvatarStack
                      size="sm"
                      collaborators={collection.collaborators as IUser[]}
                    />
                  ) : null}
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-transform" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default ChooseCollection;
