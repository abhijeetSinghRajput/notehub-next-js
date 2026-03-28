import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Lock } from "lucide-react";
import { LabeledInput } from "@/components/labeled-input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FileIcon from "../icons/FileIcon";
import { useRouter } from "next/navigation";
import { ICollection, INote } from "@/types/model";
import { cn } from "@/lib/utils";
import { useDraftStore } from "@/app/stores/useDraftStore";
import NProgress from "nprogress";

interface AddNoteProps {
  setSelectedCollection: (collection: ICollection | null) => void;
  selectedCollection: ICollection | null;
  setActiveTab: (tab: string) => void;
  setOpen: (open: boolean) => void;
}

const AddNote: React.FC<AddNoteProps> = ({
  setSelectedCollection,
  selectedCollection,
  setActiveTab,
  setOpen,
}) => {
  const router = useRouter();
  const [noteName, setNoteName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const { setDraft } = useDraftStore();

  const handleAddNote = async () => {
    if (!noteName.trim() || !selectedCollection) return;

    const draftId = `draft-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const draft: INote = {
      _id: draftId,
      name: noteName,
      content: `<h1>${noteName}</h1>`,
      collectionId: selectedCollection._id,
      userId: "",
      visibility,
      collaborators: [],
      slug: draftId,
      contentUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
      tableOfContent: [],
    };

    setDraft(draftId, draft);

    setNoteName("");
    setOpen(false);
    setSelectedCollection(null);
    setActiveTab("choose-collection");

    NProgress.start();
    router.push(`/note/${draftId}/editor`);
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setActiveTab("choose-collection");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && noteName.trim()) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            tooltip="Back to Collection"
            variant="secondary"
            size="icon"
            onClick={handleBackToCollections}
            className="h-10 w-10"
            aria-label="back to collection"
          >
            <ChevronLeft />
          </Button>
          <div className="flex gap-2 items-center">
            <FileIcon className="size-12 opacity-70" />

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {selectedCollection?.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Add a new note to this collection
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-4">
          <LabeledInput
            id="note-name"
            inputClassName="bg-muted/30"
            label="Note Name"
            placeholder="Enter note title"
            value={noteName}
            onChange={(e) => setNoteName(e.target.value)}
            error={!noteName.trim() ? "Note name is required" : undefined}
            autoFocus={true}
            onKeyDown={handleKeyDown}
          />

          <div className="bg-muted/30 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
            <Switch
              checked={visibility === "private"}
              onCheckedChange={(value) =>
                setVisibility(value ? "private" : "public")
              }
              id="note-visibility"
              className="order-1 after:absolute after:inset-0"
              aria-describedby="note-visibility-description"
            />
            <div className="w-full">
              <div className="text-sm font-medium leading-none text-muted-foreground mb-4">
                Visibility
              </div>
              <div className="w-full flex grow items-start gap-3">
                <Lock size="20" />
                <div className="grid grow gap-2">
                  <Label
                    htmlFor={"note-visibility"}
                    className={cn(
                      "capitalize",
                      visibility !== "private" ? "text-muted-foreground" : "",
                    )}
                  >
                    Private
                  </Label>
                  <p
                    id={`note-visibility-description`}
                    className="text-muted-foreground text-sm"
                  >
                    {visibility === "public" ? (
                      selectedCollection?.visibility === "public" ? (
                        <>This note will be visible to everyone.</>
                      ) : (
                        <>
                          This note will be visible to you and{" "}
                          <span className="text-primary underline">
                            {selectedCollection?.name}{" "}
                          </span>
                          collaborators only.
                        </>
                      )
                    ) : (
                      <>
                        This note will be private and only visible to{" "}
                        <span className="text-primary underline"> you</span> and
                        your{" "}
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
            onClick={handleBackToCollections}
          >
            Back
          </Button>
          <Button
            className="flex-1 gap-2 h-12 rounded-xl"
            onClick={handleAddNote}
            disabled={!noteName.trim()}
          >
            Create Note
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddNote;
