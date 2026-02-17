import React from 'react';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowDownAZ,
    ArrowUp,
    ArrowUpAZ,
    ChevronLeft,
    ChevronRight,
    Bold,
    Code,
    CodeSquare,
    HeadingIcon,
    Indent,
    Italic,
    List,
    ListChecks,
    ListOrdered,
    Outdent,
    Quote,
    Redo,
    Strikethrough,
    TableIcon,
    Trash,
    UnderlineIcon,
    Undo,
} from 'lucide-react'
import InsertColLeftIcon from '@/components/icons/InsertColLeftIcon';
import InsertColRightIcon from '@/components/icons/InsertColRightIcon';
import InsertRowBelowIcon from '@/components/icons/InsertRowBelowIcon';
import InsertRowAboveIcon from '@/components/icons/InsertRowAboveIcon';

// export const COLORS = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc', '#808080'];
export const COLORS = [
    "var(--highlight-destructive)",
    "var(--highlight-warn)",
    "var(--highlight-success)",
    "var(--highlight-teal)",
    "var(--highlight-sky)",
    "var(--highlight-blue)",
    "var(--highlight-muted)",
];

export const FORMATTING_BUTTONS = [
    {
        name: 'bold',
        icon: <Bold />,
        command: 'toggleBold',
        tooltip: 'Ctrl + B',
    },
    {
        name: 'italic',
        icon: <Italic />,
        command: 'toggleItalic',
        tooltip: 'Ctrl + I',
    },
    {
        name: 'underline',
        icon: <UnderlineIcon />,
        command: 'toggleUnderline',
        tooltip: 'Ctrl + U',
    },
    {
        name: 'strike',
        icon: < Strikethrough />,
        command: 'toggleStrike',
        tooltip: 'Ctrl + Shift + S',
    },
]


export const LIST_BUTTONS = [
    {
        name: 'orderedList',
        icon: <ListOrdered />,
        command: 'toggleOrderedList',
        tooltip: "Ctrl + Shift + 7",
    },
    {
        name: 'bulletList',
        icon: <List />,
        command: 'toggleBulletList',
        tooltip: "Ctrl + Shift + 8",
    },
    {
        name: 'taskList',
        icon: <ListChecks />,
        command: 'toggleTaskList',
        tooltip: "Ctrl + Shift + 9",
    }
]

export const LIST_CONTROL_BUTTONS = [
    {
        name: ['listItem', 'taskItem'],
        icon: <Outdent />,
        command: 'liftListItem',
        tooltip: "Lift list item/task item",
    },
    {
        name: ['listItem', 'taskItem'],
        icon: <Indent />,
        command: 'sinkListItem',
        tooltip: "Sink list item/task item",
    },
];


export const BLOCK_BUTTONS = [
    {
        name: 'codeBlock',
        icon: <CodeSquare />,
        command: 'toggleCodeBlock',
        tooltip: 'Code Block"',
    },
    {
        name: 'code',
        icon: <Code />,
        command: 'toggleCode',
        tooltip: 'Code',
    },
    {
        name: 'blockquote',
        icon: <Quote />,
        command: 'toggleBlockquote',
        tooltip: 'blockquote',
    },
];

export const CONTROL_BUTTONS = [
    {
        icon: <Undo />,
        command: 'undo',
        tooltip: 'Ctrl + Z',
    },
    {
        icon: <Redo />,
        command: 'redo',
        tooltip: 'Ctrl + Y',
    },
]

export const ALIGNMENT_BUTTONS = [
    {
        name: 'left',
        icon: <AlignLeft />,
        command: 'setTextAlign',
        tooltip: 'Ctrl + Shift + L',
    },
    {
        name: 'center',
        icon: <AlignCenter />,
        command: 'setTextAlign',
        tooltip: 'Ctrl + Shift + E',
    },
    {
        name: 'right',
        icon: <AlignRight />,
        command: 'setTextAlign',
        tooltip: 'Ctrl + Shift + R',
    },
    {
        name: 'justify',
        icon: <AlignJustify />,
        command: 'setTextAlign',
        tooltip: 'Ctrl + Shift + J',
    },
]

export const TABLE_BUTTONS = [
    {
        icon: <TableIcon />,
        command: "insertTable",
        tooltip: "Insert talbe",
        params: {
            rows: 3, cols: 3, withHeaderRow: true
        },
    },
    {
        icon: <HeadingIcon />,
        command: "toggleHeaderRow",
        tooltip: "Toggle header",
    },
    {
        icon: <Trash />,
        command: "deleteTable",
        tooltip: "Delete table",
    },
];

export const TABLE_ROW_CONTROLS = [
    {
        icon: <ArrowUp />,
        command: "moveRowUp",
        tooltip: "Move row up",
    },
    {
        icon: <ArrowDown />,
        command: "moveRowDown",
        tooltip: "Move row down",
    },
    {
        icon: <InsertRowAboveIcon />,
        command: "addRowBefore",
        tooltip: "Add row before",
    },
    {
        icon: <InsertRowBelowIcon />,
        command: "addRowAfter",
        tooltip: "Add row after",
    },
    {
        icon: <Trash />,
        command: "deleteRow",
        tooltip: "Delete row",
    },
];

export const TABLE_COLUMN_CONTROLS = [
    {
        icon: <ChevronLeft />,
        command: "moveColumnLeft",
        tooltip: "Move column left",
    },
    {
        icon: <ChevronRight />,
        command: "moveColumnRight",
        tooltip: "Move column right",
    },
    {
        icon: <InsertColLeftIcon />,
        command: "addColumnBefore",
        tooltip: "Add column before",
    },
    {
        icon: <InsertColRightIcon />,
        command: "addColumnAfter",
        tooltip: "Add column after",
    },
    {
        icon: <ArrowDownAZ />,
        command: "sortColumnAsc",
        tooltip: "Sort column A-Z",
    },
    {
        icon: <ArrowUpAZ />,
        command: "sortColumnDesc",
        tooltip: "Sort column Z-A",
    },
    {
        icon: <Trash />,
        command: "deleteColumn",
        tooltip: "Delete column",
    },
];