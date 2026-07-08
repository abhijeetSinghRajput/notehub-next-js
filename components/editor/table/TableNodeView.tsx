"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import {
  Trash2,
  Rows3,
  GripVertical,
  GripHorizontal,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  selectColumn,
  selectRow,
  selectTable,
  getSelectionInfo,
  type TableSelectionInfo,
} from "./tableCommands";
import { TablePopover } from "../TablePopover";
import {
  TABLE_COLUMN_CONTROLS,
  TABLE_ROW_CONTROLS,
} from "../config/menu.config";
import { Button } from "@/components/ui/button";

interface GripRect {
  index: number;
  offset: number;
  size: number;
}

const TABLE_SELECT_CONTROLS = [
  {
    command: "toggleHeaderRow",
    icon: <Rows3 size={14} />,
    tooltip: "Toggle header row",
  },
  {
    command: "deleteTable",
    icon: <Trash2 size={14} />,
    tooltip: "Delete table",
  },
];

export const TableNodeView: React.FC<NodeViewProps> = ({
  node,
  editor,
  getPos,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const addColBtnRef = useRef<HTMLButtonElement>(null);
  const addRowBtnRef = useRef<HTMLButtonElement>(null);
  const [cols, setCols] = useState<GripRect[]>([]);
  const [rows, setRows] = useState<GripRect[]>([]);
  const [selection, setSelection] = useState<TableSelectionInfo | null>(null);
  const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);

  const tableStart = useCallback(() => {
    return typeof getPos === "function" ? (getPos() as number) + 1 : null;
  }, [getPos]);

  const measure = useCallback(() => {
    const tableEl = tableRef.current;
    const stageEl = stageRef.current;
    if (!tableEl || !stageEl) return;

    const stageBox = stageEl.getBoundingClientRect();

    const firstRow = tableEl.querySelector("tr");
    const colRects: GripRect[] = [];
    if (firstRow) {
      let i = 0;
      firstRow.querySelectorAll(":scope > th, :scope > td").forEach((cell) => {
        const box = (cell as HTMLElement).getBoundingClientRect();
        colRects.push({
          index: i,
          offset: box.left - stageBox.left,
          size: box.width,
        });
        i += 1;
      });
    }
    setCols(colRects);

    const rowRects: GripRect[] = [];
    const allRows = Array.from(
      tableEl.querySelectorAll<HTMLTableRowElement>("tr"),
    );
    allRows.forEach((row, i) => {
      const firstCell = row.querySelector("th, td");
      if (!firstCell) return;
      const box = (firstCell as HTMLElement).getBoundingClientRect();
      rowRects.push({
        index: i,
        offset: box.top - stageBox.top,
        size: box.height,
      });
    });
    setRows(rowRects);

    // Right/bottom edge of the table relative to the wrapper — used to pin
    // the "add column" / "add row" buttons flush against the table, same
    // coordinate space as the grip anchors above.
    // Write directly to the DOM instead of going through setState. These two
    // buttons span the full table edge, so any extra React render-cycle
    // latency here reads as a visible "lag" — direct style mutation lands in
    // the same paint as the table's own layout change, matching how the
    // corner button (pure CSS, no state) feels instantaneous.
    const left = colRects[0]?.offset ?? 0;
    const top = rowRects[0]?.offset ?? 0;
    const right = colRects.length
      ? colRects[colRects.length - 1].offset +
        colRects[colRects.length - 1].size
      : 0;
    const bottom = rowRects.length
      ? rowRects[rowRects.length - 1].offset +
        rowRects[rowRects.length - 1].size
      : 0;

    if (addColBtnRef.current) {
      addColBtnRef.current.style.left = `${right}px`;
      addColBtnRef.current.style.top = `${top}px`;
      addColBtnRef.current.style.height = `${Math.max(bottom - top, 0)}px`;
    }
    if (addRowBtnRef.current) {
      addRowBtnRef.current.style.left = `${left}px`;
      addRowBtnRef.current.style.top = `${bottom}px`;
      addRowBtnRef.current.style.width = `${Math.max(right - left, 0)}px`;
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (tableRef.current) ro.observe(tableRef.current);

    const onUpdate = () => requestAnimationFrame(measure);
    editor.on("update", onUpdate);

    // ── Scroll fix ──────────────────────────────────────────────────────
    // measure() previously only ran on content update / resize, never on
    // plain scroll. Grip offsets are computed once via getBoundingClientRect
    // relative to the wrapper, so scrolling the editor's scroll container
    // doesn't itself require remeasuring (offsets are relative, not viewport-
    // absolute) — BUT any open Radix popover anchored to the trigger DOES
    // need continuous position updates during scroll, which is handled by
    // `updatePositionStrategy="always"` on the popover Content. We also
    // remeasure defensively here in case of nested scroll containers that
    // affect layout (e.g. sidebar collapse) mid-scroll.
    const scrollParent =
      wrapperRef.current?.closest(".ProseMirror") ??
      wrapperRef.current?.closest("[data-scroll-container]") ??
      null;
    const onScroll = () => requestAnimationFrame(measure);
    scrollParent?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      editor.off("update", onUpdate);
      scrollParent?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [editor, measure]);

  useEffect(() => {
    const onSelectionUpdate = () => {
      const start = tableStart();
      if (start === null) {
        setSelection(null);
        return;
      }
      setSelection(getSelectionInfo(editor.view, start, node));
    };
    onSelectionUpdate();
    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("transaction", onSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("transaction", onSelectionUpdate);
    };
  }, [editor, node, tableStart]);

  const selectColAt = (colIndex: number) => {
    const start = tableStart();
    if (start === null) return;
    selectColumn(editor.view, start, node, colIndex);
  };

  const selectRowAt = (rowIndex: number) => {
    const start = tableStart();
    if (start === null) return;
    selectRow(editor.view, start, node, rowIndex);
  };

  const selectWholeTable = () => {
    const start = tableStart();
    if (start === null) return;
    selectTable(editor.view, start, node);
  };

  const addColAtEnd = () => {
    const start = tableStart();
    if (start === null || cols.length === 0) return;

    // Move the table selection to the last column, then insert after it
    selectColumn(editor.view, start, node, cols.length - 1);
    editor.chain().focus().addColumnAfter().run();
  };

  const addRowAtEnd = () => {
    const start = tableStart();
    if (start === null || rows.length === 0) return;

    // Move the table selection to the last row, then insert after it
    selectRow(editor.view, start, node, rows.length - 1);
    editor.chain().focus().addRowAfter().run();
  };

  return (
    <NodeViewWrapper className="tableWrapper" ref={wrapperRef}>
      <div className="tableScroll" ref={tableScrollRef}>
        <div className="table-stage" ref={stageRef}>
          <div className="table-grip-col-track" contentEditable={false}>
            {cols.map((c) => {
              const key = `col-${c.index}`;
              return (
                <div
                  key={key}
                  className="table-grip-anchor"
                  style={{ left: c.offset, width: c.size }}
                >
                  <TablePopover
                    editor={editor}
                    controllers={TABLE_COLUMN_CONTROLS as any}
                    triggerIcon={<GripHorizontal />}
                    triggerClassName={cn(
                      "table-grip-trigger table-grip-trigger-col",
                      selection?.type === "col" &&
                        selection.index === c.index &&
                        "table-grip-active",
                    )}
                    triggerVariant={"secondary"}
                    open={openPopoverKey === key}
                    onOpenChange={(o) => setOpenPopoverKey(o ? key : null)}
                    onTriggerPointerDown={() => selectColAt(c.index)}
                  />
                </div>
              );
            })}
          </div>

          <div className="table-grip-row-track" contentEditable={false}>
            {rows.map((r) => {
              const key = `row-${r.index}`;
              return (
                <div
                  key={key}
                  className="table-grip-anchor"
                  style={{ top: r.offset, height: r.size }}
                >
                  <TablePopover
                    editor={editor}
                    controllers={TABLE_ROW_CONTROLS as any}
                    triggerClassName={cn(
                      "table-grip-trigger table-grip-trigger-row",
                      selection?.type === "row" &&
                        selection.index === r.index &&
                        "table-grip-active",
                    )}
                    open={openPopoverKey === key}
                    triggerVariant={"secondary"}
                    triggerIcon={<GripVertical />}
                    onOpenChange={(o) => setOpenPopoverKey(o ? key : null)}
                    onTriggerPointerDown={() => selectRowAt(r.index)}
                  />
                </div>
              );
            })}
          </div>

          <div className="table-corner-select" contentEditable={false}>
            <TablePopover
              editor={editor}
              controllers={TABLE_SELECT_CONTROLS as any}
              triggerIcon={<span className="table-corner-dot" />}
              triggerClassName="table-corner-btn"
              triggerTooltip="Table options"
              triggerVariant={"secondary"}
              open={openPopoverKey === "corner"}
              onOpenChange={(o) => setOpenPopoverKey(o ? "corner" : null)}
              onTriggerPointerDown={selectWholeTable}
            />
          </div>

          <Button
            variant="secondary"
            className="table-add-col-btn"
            contentEditable={false}
            ref={addColBtnRef}
            onClick={addColAtEnd}
            aria-label="Add column"
            title="Add column"
          >
            <Plus size={14} />
          </Button>

          <Button
            variant="secondary"
            className="table-add-row-btn"
            contentEditable={false}
            ref={addRowBtnRef}
            onClick={addRowAtEnd}
            aria-label="Add row"
            title="Add row"
          >
            <Plus size={14} />
          </Button>

          <table ref={tableRef}>
            <NodeViewContent as={"tbody" as any} />
          </table>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
