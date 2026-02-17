import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import React, { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { Button } from '../ui/button'
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
    open,
    onOpenChange,
}: TablePopoverProps) => {
    const canRunController = (controller: TableController) => {
        const canChain = editor.can().chain().focus() as any;
        const command = canChain[controller.command];
        if (typeof command !== "function") return false;
        if (controller.params) {
            return command(controller.params).run();
        }
        return command().run();
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant={triggerVariant}
                    size={triggerSize}
                    tooltip={triggerTooltip}
                    className={triggerClassName}
                >
                    {triggerIcon}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="bg-popover border border-input rounded-lg p-1 w-min"
                style={{ zIndex: 70 }}
                align="start"
            >
                {controllers.map((controller: TableController, index: number) => {
                    const isDisabled = !canRunController(controller);

                    return (
                        <Button
                            key={index}
                            variant="ghost"
                            disabled={isDisabled}
                            className="w-full justify-start p-2 font-normal leading-tight h-8"
                            onClick={() => {
                                if (isDisabled) return;
                                const chain = editor.chain().focus() as any;
                                const command = chain[controller.command];
                                if (typeof command !== "function") return;
                                if (controller.params) {
                                    command(controller.params).run();
                                } else {
                                    command().run();
                                }
                                onOpenChange?.(false);
                            }}
                        >
                            {controller.icon} {controller.tooltip}
                        </Button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
};

