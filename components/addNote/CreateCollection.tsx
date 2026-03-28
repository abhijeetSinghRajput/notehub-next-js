import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Globe, Loader2, Lock } from "lucide-react";
import FolderPlusIcon from "../icons/FolderPlusIcon";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNoteStore } from "@/app/stores/useNoteStore";
import { LabeledInput } from "@/components/labeled-input";
import { ICollection } from "@/types/model";
import { cn } from "@/lib/utils";

interface CreateCollectionProps {
  setSelectedCollection: (collection: ICollection) => void;
  setActiveTab: (tab: string) => void;
}

const CreateCollection: React.FC<CreateCollectionProps> = ({
  setSelectedCollection,
  setActiveTab,
}) => {
  const [collectionName, setCollectionName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const { createCollection, status } = useNoteStore();

  const handleAddCollection = async () => {
    if (!collectionName.trim() || status.collection.state === "creating")
      return;

    const collection = await createCollection({
      name: collectionName,
      visibility,
    });
    if (collection) {
      setSelectedCollection(collection);
      setCollectionName("");
      setActiveTab("add-note");
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      collectionName.trim() &&
      status.collection.state !== "creating"
    ) {
      e.preventDefault();
      handleAddCollection();
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            tooltip="Back"
            variant="secondary"
            size="icon"
            onClick={() => setActiveTab("choose-collection")}
            className="h-10 w-10"
            aria-label="back"
          >
            <ChevronLeft />
          </Button>
          <div className="flex gap-2 items-center">
            <FolderPlusIcon className="size-12 opacity-70" />
            <div>
              <h3 className="text-lg font-semibold">Create Collection</h3>
              <p className="text-sm text-muted-foreground">
                Create a new collection to organize your notes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-4">
          <LabeledInput
            id="collection-name"
            inputClassName="bg-muted/30"
            label="Collection Name"
            placeholder="Enter collection name"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            error={
              !collectionName.trim() ? "Collection name is required" : undefined
            }
            autoFocus={true}
            onKeyDown={handleKeyDown}
          />

          <div className="bg-muted/30 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
            <Switch
              checked={visibility === "private"}
              onCheckedChange={(value) =>
                setVisibility(value ? "private" : "public")
              }
              id="collection-visibility"
              className="order-1 after:absolute after:inset-0"
              aria-describedby="collection-visibility-description"
            />
            <div className="w-full">
              <div className="text-sm font-medium leading-none text-muted-foreground mb-4">
                Visibility
              </div>
              <div className="w-full flex grow items-start gap-3">
                <Lock size="20" />
                <div className="grid grow gap-2">
                  <Label
                    htmlFor={"collection-visibility"}
                    className={cn(
                      "capitalize",
                      visibility !== "private" ? "text-muted-foreground" : "",
                    )}
                  >
                    private
                  </Label>
                  <p
                    id="collection-visibility-description"
                    className="text-muted-foreground text-sm"
                  >
                    {visibility === "public" ? (
                      <>
                        This collection will be visible to{" "}
                        <span className="text-primary underline">everyone</span>
                        .
                      </>
                    ) : (
                      <>
                        This collection will be{" "}
                        <span className="text-primary underline">private</span>{" "}
                        and only visible to your{" "}
                        <span className="text-primary underline">
                          collaborators
                        </span>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 h-12 rounded-xl"
            onClick={() => setActiveTab("choose-collection")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2 h-12 rounded-xl"
            onClick={handleAddCollection}
            disabled={
              !collectionName.trim() || status.collection.state === "creating"
            }
          >
            {status.collection.state === "creating" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create Collection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCollection;
