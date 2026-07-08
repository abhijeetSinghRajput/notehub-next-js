import type { EditorView } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { TableMap, CellSelection } from "prosemirror-tables";

/**
 * `tableStart` = position right AFTER the <table> opening token.
 * If `getPos()` from the NodeView gives you the position of the table
 * node itself, tableStart = getPos() + 1.
 */

function dispatchCellSelection(
  view: EditorView,
  tableStart: number,
  table: PMNode,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
) {
  const map = TableMap.get(table);
  const headPos = tableStart + map.positionAt(fromRow, fromCol, table);
  const anchorPos = tableStart + map.positionAt(toRow, toCol, table);
  const $head = view.state.doc.resolve(headPos);
  const $anchor = view.state.doc.resolve(anchorPos);
  const selection = new CellSelection($anchor, $head);
  view.dispatch(view.state.tr.setSelection(selection as any));
  view.focus();
}

export function selectColumn(view: EditorView, tableStart: number, table: PMNode, col: number) {
  const map = TableMap.get(table);
  dispatchCellSelection(view, tableStart, table, 0, col, map.height - 1, col);
}

export function selectRow(view: EditorView, tableStart: number, table: PMNode, row: number) {
  const map = TableMap.get(table);
  dispatchCellSelection(view, tableStart, table, row, 0, row, map.width - 1);
}

export function selectTable(view: EditorView, tableStart: number, table: PMNode) {
  const map = TableMap.get(table);
  dispatchCellSelection(view, tableStart, table, 0, 0, map.height - 1, map.width - 1);
}

export type TableSelectionInfo =
  | { type: "col"; index: number }
  | { type: "row"; index: number }
  | { type: "table" };

/**
 * Reads the CURRENT editor selection and, if it's a full column, full row,
 * or the whole table of THIS table node, returns what kind it is.
 * Returns null for partial/unrelated selections.
 */
export function getSelectionInfo(
  view: EditorView,
  tableStart: number,
  table: PMNode,
): TableSelectionInfo | null {
  const sel = view.state.selection as any;
  if (!sel || sel.constructor?.name !== "CellSelection") return null;

  const anchorRel = sel.$anchorCell.pos - tableStart;
  const headRel = sel.$headCell.pos - tableStart;

  // Guard: selection must belong to THIS table, not some other one.
  if (anchorRel < 0 || anchorRel >= table.nodeSize || headRel < 0 || headRel >= table.nodeSize) {
    return null;
  }

  const map = TableMap.get(table);
  let rect;
  try {
    rect = map.rectBetween(anchorRel, headRel);
  } catch {
    return null;
  }

  const fullWidth = rect.right - rect.left === map.width;
  const fullHeight = rect.bottom - rect.top === map.height;

  if (fullWidth && fullHeight) return { type: "table" };
  if (fullHeight && rect.right - rect.left === 1) return { type: "col", index: rect.left };
  if (fullWidth && rect.bottom - rect.top === 1) return { type: "row", index: rect.top };
  return null;
}