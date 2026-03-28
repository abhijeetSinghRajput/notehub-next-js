"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { GripHorizontal, GripVertical, Plus } from "lucide-react";
import { findTable, TableMap } from "prosemirror-tables";
import { TablePopover } from "./TablePopover";
import { TABLE_COLUMN_CONTROLS, TABLE_ROW_CONTROLS } from "./config/menu.config";
import { Button } from "@/components/ui/button";

const HANDLE_SIZE = 20;
const GAP = 3;

/**
 * Synchronous position math — no async, no floating-ui, no stale closures.
 *
 * All handles are position:fixed top:0 left:0 and move via transform:translate3d.
 * getBoundingClientRect() is always viewport-relative, which is exactly what
 * position:fixed needs. Called synchronously inside a rAF so coords are always
 * fresh at paint time.
 */
function applyPositions(
  cell:      HTMLTableCellElement,
  table:     HTMLTableElement,
  colEl:     HTMLDivElement,
  rowEl:     HTMLDivElement,
  addRowEl:  HTMLDivElement,
  addColEl:  HTMLDivElement,
) {
  const tr = table.getBoundingClientRect();
  const cr = cell.getBoundingClientRect();
  const rr = (cell.parentElement as HTMLTableRowElement | null)
               ?.getBoundingClientRect() ?? cr;

  // Clamp so handles never go above/left of viewport edge
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── Col grip: horizontally centered on active column, sits above table ────
  const colX = Math.min(
    Math.max(cr.left + cr.width / 2 - HANDLE_SIZE / 2, 4),
    vw - HANDLE_SIZE - 4,
  );
  const colY = Math.max(tr.top - HANDLE_SIZE - GAP, 4);
  colEl.style.transform = `translate3d(${Math.round(colX)}px,${Math.round(colY)}px,0)`;

  // ── Row grip: vertically centered on active row, sits left of table ───────
  const rowX = Math.max(tr.left - HANDLE_SIZE - GAP, 4);
  const rowY = Math.min(
    Math.max(rr.top + rr.height / 2 - HANDLE_SIZE / 2, 4),
    vh - HANDLE_SIZE - 4,
  );
  rowEl.style.transform = `translate3d(${Math.round(rowX)}px,${Math.round(rowY)}px,0)`;

  // ── Add-row: full table width, just below table ───────────────────────────
  addRowEl.style.width     = `${Math.round(tr.width)}px`;
  addRowEl.style.transform = `translate3d(${Math.round(tr.left)}px,${Math.round(tr.bottom + GAP)}px,0)`;

  // ── Add-col: full table height, just right of table ───────────────────────
  addColEl.style.height    = `${Math.round(tr.height)}px`;
  addColEl.style.transform = `translate3d(${Math.round(tr.right + GAP)}px,${Math.round(tr.top)}px,0)`;
}

export default function TableHandles() {
  const { editor } = useCurrentEditor();

  const colRef    = useRef<HTMLDivElement>(null);
  const rowRef    = useRef<HTMLDivElement>(null);
  const addRowRef = useRef<HTMLDivElement>(null);
  const addColRef = useRef<HTMLDivElement>(null);

  // React state: only visibility booleans — never coordinates
  const [visible,   setVisible]   = useState(false);
  const [isRowMenu, setIsRowMenu] = useState(false);
  const [isColMenu, setIsColMenu] = useState(false);

  const cellRef      = useRef<HTMLTableCellElement | null>(null);
  const tableRef     = useRef<HTMLTableElement    | null>(null);
  const lastCellRef  = useRef<HTMLTableCellElement | null>(null);
  const isHoveredRef = useRef(false);
  const isMenuRef    = useRef(false);
  const rafRef       = useRef<number | null>(null);

  useEffect(() => {
    isMenuRef.current = isRowMenu || isColMenu;
  }, [isRowMenu, isColMenu]);

  // ── Schedule a synchronous position update inside rAF ─────────────────────
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      const cell  = cellRef.current;
      const table = tableRef.current;
      const colEl    = colRef.current;
      const rowEl    = rowRef.current;
      const addRowEl = addRowRef.current;
      const addColEl = addColRef.current;

      if (!cell || !table || !colEl || !rowEl || !addRowEl || !addColEl) return;

      const tr = table.getBoundingClientRect();

      // Table fully off-screen → hide all
      if (tr.width === 0 || tr.bottom < 0 || tr.top > window.innerHeight) {
        [colEl, rowEl, addRowEl, addColEl].forEach(el => { el.style.opacity = "0"; });
        return;
      }

      // Apply positions synchronously — all 4 in one rAF tick
      applyPositions(cell, table, colEl, rowEl, addRowEl, addColEl);

      // Show all
      [colEl, rowEl, addRowEl, addColEl].forEach(el => { el.style.opacity = "1"; });
    });
  }, []);

  const activate = useCallback((
    cell:  HTMLTableCellElement,
    table: HTMLTableElement,
  ) => {
    cellRef.current  = cell;
    tableRef.current = table;
    setVisible(true);
    scheduleUpdate();
  }, [scheduleUpdate]);

  const hide = useCallback(() => {
    if (isHoveredRef.current || isMenuRef.current) return;
    setVisible(false);
    lastCellRef.current = null;
  }, []);

  // ── Highlights — pure DOM, zero setState ─────────────────────────────────
  const clearHL = useCallback(() => {
    tableRef.current
      ?.querySelectorAll(".tth-hl-r,.tth-hl-c,.tth-hl-cell")
      .forEach(el => el.classList.remove("tth-hl-r", "tth-hl-c", "tth-hl-cell"));
    tableRef.current?.classList.remove("tth-active");
  }, []);

  useEffect(() => {
    clearHL();
    const t = tableRef.current, c = cellRef.current;
    if (!t || !c) return;
    t.classList.toggle("tth-active", isRowMenu || isColMenu);
    if (isRowMenu)
      c.parentElement?.querySelectorAll("td,th")
        .forEach(el => el.classList.add("tth-hl-r"));
    if (isColMenu) {
      const idx = c.cellIndex;
      t.querySelectorAll("tr").forEach(tr => {
        (tr as HTMLTableRowElement)
          .cells[Math.min(idx, (tr as HTMLTableRowElement).cells.length - 1)]
          ?.classList.add("tth-hl-c");
      });
    }
    c.classList.add("tth-hl-cell");
  }, [isRowMenu, isColMenu, clearHL]);

  // ── Add row / col ─────────────────────────────────────────────────────────
  const addRow = useCallback(() => {
    if(!editor) return;

    const info = findTable(editor.state.selection.$from);
    if (!info) return;
    const map = TableMap.get(info.node);
    const pos = info.start + map.positionAt(map.height - 1, 0, info.node);
    editor.chain().focus().setTextSelection(pos).addRowAfter().run();
  }, [editor]);

  const addCol = useCallback(() => {
    if (!editor) return;
    
    const info = findTable(editor.state.selection.$from);
    if (!info) return;
    const map = TableMap.get(info.node);
    const pos = info.start + map.positionAt(0, map.width - 1, info.node);
    editor.chain().focus().setTextSelection(pos).addColumnAfter().run();
  }, [editor]);

  const closeMenus = useCallback(() => {
    setIsRowMenu(false);
    setIsColMenu(false);
  }, []);

  // ── Event wiring ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onMove = (e: MouseEvent) => {
      const el    = e.target instanceof HTMLElement ? e.target : (e.target as Node | null)?.parentElement;
      const cell  = el?.closest<HTMLTableCellElement>("td,th") ?? null;
      const table = cell?.closest<HTMLTableElement>("table") ?? null;

      if (cell && table) {
        if (cell !== lastCellRef.current) {
          lastCellRef.current = cell;
          activate(cell, table);
        }
        return;
      }

      // Stay visible when hovering just outside the table (within padding)
      const t = tableRef.current;
      if (t) {
        const r = t.getBoundingClientRect();
        if (
          e.clientX >= r.left - 16 && e.clientX <= r.right  + 16 &&
          e.clientY >= r.top  - 16 && e.clientY <= r.bottom + 16
        ) return;
      }

      lastCellRef.current = null;
      hide();
    };

    const onLeave = () => {
      lastCellRef.current = null;
      hide();
    };

    // Scroll: always recompute — this is what keeps handles tracking the table
    const onScroll = () => {
      if (!cellRef.current || !tableRef.current) return;
      scheduleUpdate();
    };

    const onSelection = () => {
      if (!editor.isActive("table")) {
        if (!isMenuRef.current) { hide(); clearHL(); closeMenus(); }
        return;
      }
      const node = editor.view.nodeDOM(editor.state.selection.from);
      const el   = node instanceof HTMLElement ? node : (node as Node | null)?.parentElement;
      const cell  = el?.closest<HTMLTableCellElement>("td,th") ?? null;
      const table = cell?.closest<HTMLTableElement>("table") ?? null;
      if (cell && table) activate(cell, table);
    };

    dom.addEventListener("mousemove",  onMove);
    dom.addEventListener("mouseleave", onLeave);
    // capture:true catches scroll on any scrollable ancestor, not just window
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    editor.on("selectionUpdate", onSelection);
    editor.on("update",          onSelection);

    return () => {
      dom.removeEventListener("mousemove",  onMove);
      dom.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll, { capture: true });
      editor.off("selectionUpdate", onSelection);
      editor.off("update",          onSelection);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearHL();
    };
  }, [editor, activate, hide, scheduleUpdate, clearHL, closeMenus]);

  if (!editor) return null;
  const menuOpen = isRowMenu || isColMenu;

  return (
    <>
      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
          onMouseDown={e => { e.preventDefault(); closeMenus(); }}
        />
      )}

      {/* Outer wrapper: pointer-events:none — never blocks editor */}
      <div style={{
        position: "fixed", inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 80ms ease",
      }}>

        {/* Col grip */}
        <div ref={colRef} style={handleStyle(55)}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; hide(); }}
        >
          <TablePopover
            editor={editor}
            controllers={TABLE_COLUMN_CONTROLS}
            triggerIcon={<GripHorizontal className="size-3" />}
            triggerSize="icon-xs"
            triggerVariant="ghost"
            triggerClassName="tth-btn"
            open={isColMenu}
            onOpenChange={o => { setIsColMenu(o); if (o) setIsRowMenu(false); }}
          />
        </div>

        {/* Row grip */}
        <div ref={rowRef} style={handleStyle(55)}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; hide(); }}
        >
          <TablePopover
            editor={editor}
            controllers={TABLE_ROW_CONTROLS}
            triggerIcon={<GripVertical className="size-3" />}
            triggerSize="icon-xs"
            triggerVariant="ghost"
            triggerClassName="tth-btn"
            open={isRowMenu}
            onOpenChange={o => { setIsRowMenu(o); if (o) setIsColMenu(false); }}
          />
        </div>

        {/* Add row */}
        <div ref={addRowRef} style={{ ...handleStyle(52), height: HANDLE_SIZE }}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; hide(); }}
        >
          <Button size="xs" variant="ghost" tooltip="Add row"
            className="tth-btn h-full w-full rounded-none"
            onMouseDown={e => e.preventDefault()}
            onClick={addRow}
          >
            <Plus className="size-3" />
          </Button>
        </div>

        {/* Add col */}
        <div ref={addColRef} style={{ ...handleStyle(52), width: HANDLE_SIZE }}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; hide(); }}
        >
          <Button size="xs" variant="ghost" tooltip="Add column"
            className="tth-btn h-full w-full rounded-none"
            onMouseDown={e => e.preventDefault()}
            onClick={addCol}
          >
            <Plus className="size-3" />
          </Button>
        </div>

      </div>
    </>
  );
}

// Shared base style for all handle elements
function handleStyle(zIndex: number): React.CSSProperties {
  return {
    position:    "fixed",
    top:         0,
    left:        0,
    zIndex,
    pointerEvents: "auto",
    opacity:     0,
    willChange:  "transform",
    // No transition on transform — instant tracking is the goal
    transition:  "opacity 80ms ease",
  };
}