import AddNoteDialog from "@/components/AddNoteDialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { ICollection } from "@/types/model";

interface EmptyStateProps {
  icon: ReactNode; // For JSX icons or any React element
  title: string;
  description: string;
  showCreateButton?: boolean; // optional if you want
  defaultCollection?: ICollection | null;
}

export const EmptyState = ({
  icon,
  title,
  description,
  showCreateButton = false,
  defaultCollection,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      {icon}
      <h3 className="text-xl font-medium">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {description}
      </p>
      {showCreateButton && (
        <AddNoteDialog
          defaultCollection={defaultCollection}
          trigger={
            <Button tooltip="Create Notes">Create your first note</Button>
          }
        />
      )}
    </div>
  );
};
