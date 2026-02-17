import { Color } from "@tiptap/extension-color";
import { TextStyleKit } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  ListItem,
  TaskList,
  TaskItem,
  ListKeymap,
} from "@tiptap/extension-list";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import {
  findTable,
  moveTableColumn,
  moveTableRow,
  selectedRect,
} from "prosemirror-tables";
import { Placeholder } from "@tiptap/extensions";
import { SlashCommand } from "@/components/SlashCommand";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import { all } from "lowlight";
import CodeBlockComponent from "@/components/CodeBlockComponent";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Dropcursor, Gapcursor } from "@tiptap/extensions";
import Link from "@tiptap/extension-link";
import Math from "@tiptap/extension-mathematics";
import TableOfContents, {
  getHierarchicalIndexes,
} from "@tiptap/extension-table-of-contents";
import { ResizableImageExtension } from "../ResizableImageExtension";

const lowlight = createLowlight(all);

const TabExtension = Extension.create({
  name: "tabHandler",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // Allow default behavior in tables
        if (editor.isActive("table")) {
          return false; // Let the table extension handle it
        }

        // Only allow Tab in code blocks
        if (editor.isActive("codeBlock")) {
          return false; // Let CustomCodeBlock handle it
        }

        // Block Tab everywhere else
        return true;
      },

      "Shift-Tab": ({ editor }) => {
        // Allow default behavior in tables
        if (editor.isActive("table")) {
          return false; // Let the table extension handle it
        }

        // Only allow Shift-Tab in code blocks
        if (editor.isActive("codeBlock")) {
          return false; // Let CustomCodeBlock handle it
        }

        // Block Shift-Tab everywhere else
        return true;
      },
    };
  },
});

const AutoPairExtension = Extension.create({
  name: "autoPair",

  addKeyboardShortcuts() {
    const pairs = {
      "{": "}",
      "[": "]",
      "(": ")",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    const shortcuts: Record<string, (props: { editor: any }) => boolean> = {};

    Object.entries(pairs).forEach(([open, close]) => {
      shortcuts[open] = ({ editor }: { editor: any }) => {
        if (!editor.isActive("codeBlock")) return false;
        const { state } = editor;
        const { selection } = state;
        const { from, empty } = selection;
        if (!empty) return false;

        editor.commands.insertContent(open + close);
        editor.commands.setTextSelection(from + 1);
        return true;
      };
    });

    return shortcuts;
  },
});

const TableActionsExtension = Extension.create({
  name: "tableActions",

  addCommands() {
    const sortColumn = (direction: "asc" | "desc") =>
      ({ state, dispatch }: { state: any; dispatch?: any }) => {
        const tableInfo = findTable(state.selection.$from);
        if (!tableInfo) return false;

        const rect = selectedRect(state);
        const tableNode = tableInfo.node;
        const columnIndex = rect.left;

        const rows = [] as any[];
        for (let i = 0; i < tableNode.childCount; i += 1) {
          rows.push(tableNode.child(i));
        }

        const firstRow = rows[0];
        const hasHeaderRow = Boolean(
          firstRow &&
          firstRow.content.content.some(
            (cell: any) => cell.type.name === "tableHeader",
          ),
        );

        const headerRows = hasHeaderRow ? rows.slice(0, 1) : [];
        const bodyRows = hasHeaderRow ? rows.slice(1) : rows;

        const normalizeValue = (value: string) => value.trim().toLowerCase();
        const getCellValue = (row: any) => {
          if (columnIndex >= row.childCount) return "";
          const cell = row.child(columnIndex);
          return cell?.textContent ?? "";
        };

        const sortedRows = bodyRows
          .map((row, index) => ({
            row,
            index,
            value: getCellValue(row),
          }))
          .sort((a, b) => {
            const valueA = normalizeValue(a.value);
            const valueB = normalizeValue(b.value);

            const numberA = Number(valueA.replace(/,/g, ""));
            const numberB = Number(valueB.replace(/,/g, ""));

            let comparison = 0;
            if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
              comparison = numberA - numberB;
            } else {
              comparison = valueA.localeCompare(valueB);
            }

            if (comparison === 0) {
              return a.index - b.index;
            }

            return direction === "asc" ? comparison : -comparison;
          })
          .map((entry) => entry.row);

        const nextRows = [...headerRows, ...sortedRows];
        const nextTable = tableNode.type.create(tableNode.attrs, nextRows);

        const tr = state.tr.replaceWith(
          tableInfo.pos,
          tableInfo.pos + tableNode.nodeSize,
          nextTable,
        );

        if (dispatch) dispatch(tr);
        return true;
      };

    return {
      moveColumnLeft:
        () =>
        ({ state, dispatch }: { state: any; dispatch?: any }) => {
          const tableInfo = findTable(state.selection.$from);
          if (!tableInfo) return false;
          const rect = selectedRect(state);
          const from = rect.left;
          if (from <= 0) return false;
          return moveTableColumn({ from, to: from - 1 })(state, dispatch);
        },
      moveColumnRight:
        () =>
        ({ state, dispatch }: { state: any; dispatch?: any }) => {
          const tableInfo = findTable(state.selection.$from);
          if (!tableInfo) return false;
          const rect = selectedRect(state);
          const from = rect.left;
          if (from >= rect.map.width - 1) return false;
          return moveTableColumn({ from, to: from + 1 })(state, dispatch);
        },
      moveRowUp:
        () =>
        ({ state, dispatch }: { state: any; dispatch?: any }) => {
          const tableInfo = findTable(state.selection.$from);
          if (!tableInfo) return false;
          const rect = selectedRect(state);
          const from = rect.top;
          if (from <= 0) return false;
          return moveTableRow({ from, to: from - 1 })(state, dispatch);
        },
      moveRowDown:
        () =>
        ({ state, dispatch }: { state: any; dispatch?: any }) => {
          const tableInfo = findTable(state.selection.$from);
          if (!tableInfo) return false;
          const rect = selectedRect(state);
          const from = rect.top;
          if (from >= rect.map.height - 1) return false;
          return moveTableRow({ from, to: from + 1 })(state, dispatch);
        },
      sortColumnAsc: () => sortColumn("asc"),
      sortColumnDesc: () => sortColumn("desc"),
    };
  },
});

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.insertContent("    "); // 4 spaces
      },
      "Shift-Tab": () => {
        // You can implement Shift-Tab behavior for code blocks here if needed
        return true;
      },
    };
  },
}).configure({ lowlight });

export const extensions = [
  Color.configure({ types: [ListItem.name] as string[] }),
  TextStyleKit.configure({ types: [ListItem.name] } as any),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    codeBlock: false,
  }),
  TableOfContents.configure({
    anchorTypes: ["heading"],
    getIndex: getHierarchicalIndexes,
    onUpdate: (anchors) => {
      window.dispatchEvent(new CustomEvent("toc-update", { detail: anchors }));
    },
  }),
  CustomCodeBlock,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Underline,
  ListKeymap,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
  }),
  TableActionsExtension,
  TableRow,
  TableHeader,
  TableCell,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "Heading " + node.attrs.level;
      } else if (node.type.name === "bulletList") return "List";
      else if (node.type.name === "orderedList") return "List";
      else if (node.type.name === "blockquote") return "Empty quote";

      return "Type / for options";
    },
  }),
  ResizableImageExtension,
  // ...keep your existing imports and code above
  Math.configure({
    blockOptions: {
      onClick: (node, pos) => {
        // dispatch an event so the dialog can open and receive data
        window.dispatchEvent(
          new CustomEvent("open-math-dialog", {
            detail: { latex: node.attrs.latex, pos, mode: "block" },
          }),
        );
      },
    },
    inlineOptions: {
      onClick: (node, pos) => {
        window.dispatchEvent(
          new CustomEvent("open-math-dialog", {
            detail: { latex: node.attrs.latex, pos, mode: "inline" },
          }),
        );
      },
    },
  }),

  SlashCommand,
  TabExtension,
  AutoPairExtension,
  Dropcursor,
  Gapcursor,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
    validate: (href) => /^https?:\/\//.test(href),
  }),
];
