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
}

export const TablePopover = ({
    editor,
    controllers,
    triggerIcon,
    triggerClassName,
    triggerTooltip,
    triggerSize = "icon",
    triggerVariant = "ghost",
}: TablePopoverProps) => {
    return (
        <Popover>
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
            <PopoverContent className="bg-popover border border-input rounded-lg  p-1 w-min" align="start">
                {
                    controllers.map((controller: TableController, index: number) => (
                        <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start p-2 font-normal leading-tight h-8"
                                                        onClick={() => {
                                                            const chain = editor.chain().focus() as any;
                                                            const command = chain[controller.command];
                                                            if (typeof command !== "function") return;
                                                            if (controller.params) {
                                                                command(controller.params).run();
                                                            } else {
                                                                command().run();
                                                            }
                                                        }}
                        >
                            {controller.icon} {controller.tooltip}
                        </Button>
                    ))
                }
            </PopoverContent>
        </Popover>
    )
}

