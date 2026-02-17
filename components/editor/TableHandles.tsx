import { useCurrentEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { GripHorizontal, GripVertical, Plus } from "lucide-react";
import { TablePopover } from "./TablePopover";
import {
  TABLE_COLUMN_CONTROLS,
  TABLE_ROW_CONTROLS,
} from "./config/menu.config";
import { Button } from "../ui/button";
import { findTable, TableMap } from "prosemirror-tables";

const HANDLE_SIZE = 22;
const HANDLE_GAP = 6;
const HOVER_PADDING = 10;

const clamp = (value: number, min: number) => Math.max(value, min);

export default function TableHandles() {
  const { editor } = useCurrentEditor();
  const [isVisible, setIsVisible] = useState(false);
  const [columnPos, setColumnPos] = useState({ left: 0, top: 0 });
  const [rowPos, setRowPos] = useState({ left: 0, top: 0 });
  const [endRowPos, setEndRowPos] = useState({ left: 0, top: 0 });
  const [endColPos, setEndColPos] = useState({ left: 0, top: 0 });

  const activeCellRef = useRef<HTMLTableCellElement | null>(null);
  const activeTableRef = useRef<HTMLTableElement | null>(null);
  const isHandleHoverRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  if (!editor) return null;

  const updatePositions = (
    cell: HTMLTableCellElement,
    table: HTMLTableElement,
  ) => {
    const cellRect = cell.getBoundingClientRect();
    const rowRect = cell.parentElement?.getBoundingClientRect() ?? cellRect;
    const tableRect = table.getBoundingClientRect();

    const columnLeft = cellRect.left + cellRect.width / 2 - HANDLE_SIZE / 2;
    const columnTop = clamp(tableRect.top - HANDLE_GAP - HANDLE_SIZE, 8);

    const rowLeft = clamp(tableRect.left - HANDLE_GAP - HANDLE_SIZE, 8);
    const rowTop = rowRect.top + rowRect.height / 2 - HANDLE_SIZE / 2;

    const endRowLeft =
      tableRect.left + tableRect.width / 2 - HANDLE_SIZE / 2;
    const endRowTop = tableRect.bottom + HANDLE_GAP;

    const endColLeft = tableRect.right + HANDLE_GAP;
    const endColTop =
      tableRect.top + tableRect.height / 2 - HANDLE_SIZE / 2;

    setColumnPos({ left: columnLeft, top: columnTop });
    setRowPos({ left: rowLeft, top: rowTop });
    setEndRowPos({ left: endRowLeft, top: endRowTop });
    setEndColPos({ left: endColLeft, top: endColTop });
  };

  const scheduleUpdate = (
    cell: HTMLTableCellElement,
    table: HTMLTableElement,
  ) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      updatePositions(cell, table);
    });
  };

  const getSelectionCell = () => {
    const { from } = editor.state.selection;
    const domAtPos = editor.view.domAtPos(from);
    const node = domAtPos.node as HTMLElement;
    const element =
      node.nodeType === Node.ELEMENT_NODE
        ? node
        : node.parentElement;
    return element?.closest("td, th") as HTMLTableCellElement | null;
  };

  const selectCellAt = (row: number, col: number) => {
    const tableInfo = findTable(editor.state.selection.$from);
    if (!tableInfo) return false;
    const map = TableMap.get(tableInfo.node);
    const safeRow = Math.min(Math.max(row, 0), map.height - 1);
    const safeCol = Math.min(Math.max(col, 0), map.width - 1);
    const pos =
      tableInfo.start +
      map.positionAt(safeRow, safeCol, tableInfo.node);
    editor.commands.setTextSelection(pos);
    return true;
  };

  const handleAddRowAtEnd = () => {
    const tableInfo = findTable(editor.state.selection.$from);
    if (!tableInfo) return;
    const map = TableMap.get(tableInfo.node);
    if (!selectCellAt(map.height - 1, 0)) return;
    editor.chain().focus().addRowAfter().run();
  };

  const handleAddColumnAtEnd = () => {
    const tableInfo = findTable(editor.state.selection.$from);
    if (!tableInfo) return;
    const map = TableMap.get(tableInfo.node);
    if (!selectCellAt(0, map.width - 1)) return;
    editor.chain().focus().addColumnAfter().run();
  };

  useEffect(() => {
    const editorDom = editor.view.dom;

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      const table = target.closest("table") as HTMLTableElement | null;

      if (cell && table) {
        activeCellRef.current = cell;
        activeTableRef.current = table;
        scheduleUpdate(cell, table);
        setIsVisible(true);
        return;
      }

      const activeTable = activeTableRef.current;
      if (activeTable) {
        const rect = activeTable.getBoundingClientRect();
        const insidePaddedArea =
          event.clientX >= rect.left - HOVER_PADDING &&
          event.clientX <= rect.right + HOVER_PADDING &&
          event.clientY >= rect.top - HOVER_PADDING &&
          event.clientY <= rect.bottom + HOVER_PADDING;

        if (insidePaddedArea || isHandleHoverRef.current) {
          setIsVisible(true);
          return;
        }
      }

      if (!isHandleHoverRef.current) {
        setIsVisible(false);
      }
    };

    const handleMouseLeave = () => {
      if (!isHandleHoverRef.current) {
        setIsVisible(false);
      }
    };

    const handleScroll = () => {
      if (activeCellRef.current && activeTableRef.current) {
        scheduleUpdate(activeCellRef.current, activeTableRef.current);
      }
    };

    const handleSelectionUpdate = () => {
      if (!editor.isActive("table")) return;
      const cell = getSelectionCell();
      const table = cell?.closest("table") as HTMLTableElement | null;
      if (cell && table) {
        activeCellRef.current = cell;
        activeTableRef.current = table;
        scheduleUpdate(cell, table);
        setIsVisible(true);
      }
    };

    editorDom.addEventListener("mousemove", handleMouseMove);
    editorDom.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, true);
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("update", handleSelectionUpdate);

    return () => {
      editorDom.removeEventListener("mousemove", handleMouseMove);
      editorDom.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll, true);
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", handleSelectionUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editor]);

  const handleEnter = () => {
    isHandleHoverRef.current = true;
    setIsVisible(true);
  };

  const handleLeave = () => {
    isHandleHoverRef.current = false;
  };

  return (
    <div
      className="tiptap-table-handle-layer"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div
        className="tiptap-table-handle tiptap-table-handle--column"
        style={{ left: columnPos.left, top: columnPos.top }}
      >
        <TablePopover
          editor={editor}
          controllers={TABLE_COLUMN_CONTROLS}
          triggerIcon={<GripHorizontal />}
          triggerSize="icon-xs"
          triggerVariant="ghost"
          triggerClassName="tiptap-table-handle-button"
        />
      </div>
      <div
        className="tiptap-table-handle tiptap-table-handle--row"
        style={{ left: rowPos.left, top: rowPos.top }}
      >
        <TablePopover
          editor={editor}
          controllers={TABLE_ROW_CONTROLS}
          triggerIcon={<GripVertical />}
          triggerSize="icon-xs"
          triggerVariant="ghost"
          triggerClassName="tiptap-table-handle-button"
        />
      </div>
      <div
        className="tiptap-table-handle tiptap-table-handle--add-row"
        style={{ left: endRowPos.left, top: endRowPos.top }}
      >
        <Button
          size="icon-xs"
          variant="ghost"
          tooltip="Add row at end"
          className="tiptap-table-handle-button"
          onClick={handleAddRowAtEnd}
        >
          <Plus />
        </Button>
      </div>
      <div
        className="tiptap-table-handle tiptap-table-handle--add-column"
        style={{ left: endColPos.left, top: endColPos.top }}
      >
        <Button
          size="icon-xs"
          variant="ghost"
          tooltip="Add column at end"
          className="tiptap-table-handle-button"
          onClick={handleAddColumnAtEnd}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
