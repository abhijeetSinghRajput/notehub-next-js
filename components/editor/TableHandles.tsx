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

const HANDLE_SIZE = 20;
const HANDLE_GAP = 0;
const HOVER_PADDING = 10;

const clamp = (value: number, min: number) => Math.max(value, min);

export default function TableHandles() {
  const { editor } = useCurrentEditor();
  const [isVisible, setIsVisible] = useState(false);
  const [isEndVisible, setIsEndVisible] = useState(false);
  const [isRowMenuOpen, setIsRowMenuOpen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [columnPos, setColumnPos] = useState({ left: 0, top: 0 });
  const [rowPos, setRowPos] = useState({ left: 0, top: 0 });
  const [endRowHandle, setEndRowHandle] = useState({
    left: 0,
    top: 0,
    width: HANDLE_SIZE,
  });
  const [endColHandle, setEndColHandle] = useState({
    left: 0,
    top: 0,
    height: HANDLE_SIZE,
  });

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

    if (
      cellRect.width === 0 ||
      cellRect.height === 0 ||
      tableRect.width === 0 ||
      tableRect.height === 0
    ) {
      return;
    }

    const columnLeft = cellRect.left + cellRect.width / 2 - HANDLE_SIZE / 2;
    const columnTop = clamp(tableRect.top - HANDLE_GAP - HANDLE_SIZE, 8);

    const rowLeft = clamp(tableRect.left - HANDLE_GAP - HANDLE_SIZE, 8);
    const rowTop = rowRect.top + rowRect.height / 2 - HANDLE_SIZE / 2;

    const tableWidth = Math.max(tableRect.width, HANDLE_SIZE);
    const tableHeight = Math.max(tableRect.height, HANDLE_SIZE);

    const endRowLeft = tableRect.left;
    const endRowTop = tableRect.bottom + HANDLE_GAP;

    const endColLeft = tableRect.right + HANDLE_GAP;
    const endColTop = tableRect.top;

    setColumnPos({ left: columnLeft, top: columnTop });
    setRowPos({ left: rowLeft, top: rowTop });
    setEndRowHandle({ left: endRowLeft, top: endRowTop, width: tableWidth });
    setEndColHandle({ left: endColLeft, top: endColTop, height: tableHeight });
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

  const syncFromFirstTableCell = () => {
    const firstCell = editor.view.dom.querySelector(
      "table td, table th",
    ) as HTMLTableCellElement | null;
    const table = firstCell?.closest("table") as HTMLTableElement | null;
    if (!firstCell || !table) {
      setIsEndVisible(false);
      return false;
    }

    activeCellRef.current = firstCell;
    activeTableRef.current = table;
    scheduleUpdate(firstCell, table);
    setIsEndVisible(true);
    return true;
  };

  const getSelectionCell = () => {
    const { from } = editor.state.selection;
    const nodeAtPos = editor.view.nodeDOM(from);
    const element =
      nodeAtPos instanceof HTMLElement
        ? nodeAtPos
        : nodeAtPos?.parentElement ?? null;
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

  const clearMenuHighlights = () => {
    const table = activeTableRef.current;
    if (!table) return;
    table.classList.remove("tiptap-table-menu-active");
    table
      .querySelectorAll(
        ".tiptap-table-row-highlight, .tiptap-table-column-highlight, .tiptap-table-focused-cell",
      )
      .forEach((element) => {
        element.classList.remove(
          "tiptap-table-row-highlight",
          "tiptap-table-column-highlight",
          "tiptap-table-focused-cell",
        );
      });
  };

  const applyMenuHighlights = () => {
    const table = activeTableRef.current;
    const cell = activeCellRef.current;

    if (!table || !cell) {
      clearMenuHighlights();
      return;
    }

    clearMenuHighlights();

    table.classList.toggle(
      "tiptap-table-menu-active",
      isRowMenuOpen || isColumnMenuOpen,
    );

    if (isRowMenuOpen) {
      const row = cell.parentElement as HTMLTableRowElement | null;
      row
        ?.querySelectorAll("td, th")
        .forEach((rowCell) => rowCell.classList.add("tiptap-table-row-highlight"));
    }

    if (isColumnMenuOpen) {
      const columnIndex = cell.cellIndex;
      if (columnIndex >= 0) {
        table.querySelectorAll("tr").forEach((tableRow) => {
          const rowCells = (tableRow as HTMLTableRowElement).cells;
          if (rowCells.length === 0) return;
          const targetCell = rowCells.item(
            Math.min(columnIndex, rowCells.length - 1),
          );
          targetCell?.classList.add("tiptap-table-column-highlight");
        });
      }
    }

    cell.classList.add("tiptap-table-focused-cell");
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
        setIsEndVisible(true);
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
      if (!editor.isActive("table")) {
        const activeTable = activeTableRef.current;
        const hasActiveTableInDom = Boolean(
          activeTable && editor.view.dom.contains(activeTable),
        );

        if (!hasActiveTableInDom && !syncFromFirstTableCell()) {
          activeCellRef.current = null;
          activeTableRef.current = null;
        }

        setIsVisible(false);
        setIsEndVisible(Boolean(activeTableRef.current));
        setIsRowMenuOpen(false);
        setIsColumnMenuOpen(false);
        clearMenuHighlights();
        return;
      }

      const cell = getSelectionCell();
      const table = cell?.closest("table") as HTMLTableElement | null;
      if (cell && table) {
        activeCellRef.current = cell;
        activeTableRef.current = table;
        scheduleUpdate(cell, table);
        setIsVisible(true);
        setIsEndVisible(true);
        applyMenuHighlights();
      }
    };

    const handleCellClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      const table = target.closest("table") as HTMLTableElement | null;
      if (!cell || !table) return;

      activeCellRef.current = cell;
      activeTableRef.current = table;
      scheduleUpdate(cell, table);
      setIsVisible(true);
      setIsEndVisible(true);
      applyMenuHighlights();
    };

    const handleCellMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      const table = target.closest("table") as HTMLTableElement | null;
      if (!cell || !table) return;

      activeCellRef.current = cell;
      activeTableRef.current = table;
      scheduleUpdate(cell, table);
    };

    editorDom.addEventListener("mousemove", handleMouseMove);
    editorDom.addEventListener("mouseleave", handleMouseLeave);
    editorDom.addEventListener("mousedown", handleCellMouseDown);
    editorDom.addEventListener("click", handleCellClick);
    window.addEventListener("scroll", handleScroll, true);
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("update", handleSelectionUpdate);
    syncFromFirstTableCell();

    return () => {
      editorDom.removeEventListener("mousemove", handleMouseMove);
      editorDom.removeEventListener("mouseleave", handleMouseLeave);
      editorDom.removeEventListener("mousedown", handleCellMouseDown);
      editorDom.removeEventListener("click", handleCellClick);
      window.removeEventListener("scroll", handleScroll, true);
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", handleSelectionUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearMenuHighlights();
    };
  }, [editor]);

  useEffect(() => {
    applyMenuHighlights();
  }, [isRowMenuOpen, isColumnMenuOpen]);

  const handleRowMenuOpenChange = (open: boolean) => {
    setIsRowMenuOpen(open);
    if (open) {
      setIsColumnMenuOpen(false);
      setIsVisible(true);
    }
  };

  const handleColumnMenuOpenChange = (open: boolean) => {
    setIsColumnMenuOpen(open);
    if (open) {
      setIsRowMenuOpen(false);
      setIsVisible(true);
    }
  };

  const closeMenus = () => {
    setIsRowMenuOpen(false);
    setIsColumnMenuOpen(false);
  };

  const handleEnter = () => {
    isHandleHoverRef.current = true;
    setIsVisible(true);
  };

  const handleLeave = () => {
    isHandleHoverRef.current = false;
  };

  const isLayerVisible = isVisible || isEndVisible;
  const isMenuOpen = isRowMenuOpen || isColumnMenuOpen;

  return (
    <div
      className="tiptap-table-handle-layer"
      style={{
        opacity: isLayerVisible ? 1 : 0,
        pointerEvents: isLayerVisible ? "auto" : "none",
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {isMenuOpen && (
        <div
          className="tiptap-table-menu-backdrop"
          onMouseDown={closeMenus}
        />
      )}
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
          open={isColumnMenuOpen}
          onOpenChange={handleColumnMenuOpenChange}
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
          open={isRowMenuOpen}
          onOpenChange={handleRowMenuOpenChange}
        />
      </div>
      <div
        className="tiptap-table-handle tiptap-table-handle--add-row"
        style={{
          left: endRowHandle.left,
          top: endRowHandle.top,
          width: endRowHandle.width,
          height: HANDLE_SIZE,
        }}
      >
        <Button
          size="xs"
          variant="ghost"
          tooltip="Add row at end"
          className="tiptap-table-handle-button h-full w-full rounded-none"
          onClick={handleAddRowAtEnd}
        >
          <Plus />
        </Button>
      </div>
      <div
        className="tiptap-table-handle tiptap-table-handle--add-column"
        style={{
          left: endColHandle.left,
          top: endColHandle.top,
          width: HANDLE_SIZE,
          height: endColHandle.height,
        }}
      >
        <Button
          size="xs"
          variant="ghost"
          tooltip="Add column at end"
          className="tiptap-table-handle-button h-full w-full rounded-none"
          onClick={handleAddColumnAtEnd}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
