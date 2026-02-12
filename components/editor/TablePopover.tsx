import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import React, { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { Button } from '../ui/button'

interface TableController {
  command: string;
  icon: ReactNode;
  tooltip: string;
}

interface TablePopoverProps {
  editor: Editor;
  controllers: TableController[];
  triggerIcon: ReactNode;
}

export const TablePopover = ({ editor, controllers, triggerIcon }: TablePopoverProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
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
                            onClick={() => (editor.chain().focus() as any)[controller.command]().run()}
                        >
                            {controller.icon} {controller.tooltip}
                        </Button>
                    ))
                }
            </PopoverContent>
        </Popover>
    )
}

