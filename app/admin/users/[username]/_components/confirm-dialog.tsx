"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ActionType = "delete" | "ban" | "unban";

interface ConfirmDialogProps {
  action: ActionType;
  isOpen: boolean;
  userName?: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (e: React.FormEvent) => void;
}

const ConfirmDialog = ({
  action,
  isOpen,
  userName,
  loading = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) => {
  const [confirmInput, setConfirmInput] = useState("");

  const isConfirmValid = () => {
    if (action === "delete") return confirmInput.toLowerCase() === "delete";
    if (action === "ban") return confirmInput.toLowerCase() === "ban";
    return true;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>

          <AlertDialogDescription>
            You are about to <b>{action}</b> the user @{userName}.
            {action === "delete" &&
              " This action will soft delete the account. The user will no longer be visible, but their data will remain in the database."}
            {action === "ban" &&
              " This will prevent the user from logging in until they are unbanned."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {(action === "delete" || action === "ban") && (
          <div className="my-4">
            <p className="mb-2 text-sm">
              Please type <strong>{action}</strong> to confirm.
            </p>

            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Type "${action}"`}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || !isConfirmValid()}
            className={
              action === "delete"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {loading ? "Processing..." : "Confirm Action"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
