import React, { ReactNode } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "../ui/button";

interface TableController {
  command: string;
  icon: ReactNode;
  tooltip: string;
  params?: Record<string, unknown>;
}

interface TablePopoverProps {
  editor: Editor;
  controllers: TableController[];
  triggerIcon: ReactNode;
  triggerClassName?: string;
  triggerTooltip?: string;
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerDisabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TablePopover = ({
  editor,
  controllers,
  triggerIcon,
  triggerClassName,
  triggerTooltip,
  triggerSize = "icon",
  triggerVariant = "ghost",
  triggerDisabled = false,
  open,
  onOpenChange,
}: TablePopoverProps) => {
  const canRun = (ctrl: TableController) => {
    try {
      const chain = (editor.can().chain().focus() as any);
      const cmd = chain[ctrl.command];
      if (typeof cmd !== "function") return false;
      return ctrl.params ? cmd(ctrl.params).run() : cmd().run();
    } catch {
      return false;
    }
  };

  const run = (ctrl: TableController) => {
    try {
      const chain = (editor.chain().focus() as any);
      const cmd = chain[ctrl.command];
      if (typeof cmd !== "function") return;
      ctrl.params ? cmd(ctrl.params).run() : cmd().run();
    } catch {
      // ignore
    }
    onOpenChange?.(false);
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          tooltip={triggerTooltip}
          className={triggerClassName}
          disabled={triggerDisabled}
          // CRITICAL: prevent mousedown from stealing focus from the editor
          onMouseDown={(e) => e.preventDefault()}
        >
          {triggerIcon}
        </Button>
      </RadixPopover.Trigger>

      {/*
        CRITICAL FIX: always portal to document.body.
        Without this, the popover inherits the stacking context of the
        position:fixed handle layer and positions itself incorrectly.
      */}
      <RadixPopover.Portal>
        <RadixPopover.Content
          align="start"
          sideOffset={6}
          // Prevent the popover from stealing focus from the editor
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          style={{ zIndex: 9999 }}
          className="bg-popover border border-input rounded-lg p-1 w-min shadow-md"
        >
          {controllers.map((ctrl, i) => (
            <Button
              key={i}
              variant="ghost"
              disabled={!canRun(ctrl)}
              className="w-full justify-start px-2 font-normal leading-tight h-8 gap-2 text-sm"
              // CRITICAL: use onMouseDown + preventDefault so clicking a menu item
              // does NOT move focus away from the editor — the editor keeps its
              // selection and the command runs correctly on the right cell
              onMouseDown={(e) => {
                e.preventDefault();
                if (!canRun(ctrl)) return;
                run(ctrl);
              }}
            >
              {ctrl.icon}
              <span>{ctrl.tooltip}</span>
            </Button>
          ))}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};