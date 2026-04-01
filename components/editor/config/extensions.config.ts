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
import CodeBlockComponent from "@/components/CodeBlockComponent";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Extension, findChildren } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Dropcursor, Gapcursor } from "@tiptap/extensions";
import Link from "@tiptap/extension-link";
import MathExtension from "@tiptap/extension-mathematics";

import { ResizableImageExtension } from "../ResizableImageExtension";

import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import java from "highlight.js/lib/languages/java";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";        // html uses xml parser
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import plaintext from "highlight.js/lib/languages/plaintext";


declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableActions: {
      moveColumnLeft: () => ReturnType;
      moveColumnRight: () => ReturnType;
      moveRowUp: () => ReturnType;
      moveRowDown: () => ReturnType;
      sortColumnAsc: () => ReturnType;
      sortColumnDesc: () => ReturnType;
    };
  }
}

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("js", javascript);
lowlight.register("typescript", typescript);
lowlight.register("ts", typescript);
lowlight.register("python", python);
lowlight.register("py", python);
lowlight.register("cpp", cpp);
lowlight.register("c", c);
lowlight.register("java", java);
lowlight.register("css", css);
lowlight.register("html", html);
lowlight.register("xml", html);
lowlight.register("json", json);
lowlight.register("bash", bash);
lowlight.register("sh", bash);
lowlight.register("sql", sql);
lowlight.register("markdown", markdown);
lowlight.register("md", markdown);
lowlight.register("rust", rust);
lowlight.register("go", go);
lowlight.register("plaintext", plaintext);
lowlight.register("text", plaintext);

// ─── Tab / Shift-Tab ──────────────────────────────────────────────────────────
//
// Outside code blocks: Tab is blocked (don't want browser focus-jump behavior).
// Inside code blocks: delegated to CustomCodeBlock's own handler below.
// Inside tables: let the table extension handle it natively.
//
const TabExtension = Extension.create({
  name: "tabHandler",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive("table")) return false;
        if (editor.isActive("codeBlock")) return false;
        return true; // block everywhere else
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.isActive("table")) return false;
        if (editor.isActive("codeBlock")) return false;
        return true;
      },
    };
  },
});

// ─── Auto-pair brackets ───────────────────────────────────────────────────────
//
// Fixes from the original:
//   1. After insertContent(open+close) the cursor is already AFTER the pair.
//      ProseMirror's insertContent moves selection forward by the inserted length.
//      So we need to go back by close.length (1 char) not forward.
//   2. Wrap-selection: when text is selected, wrap it with open+close instead
//      of replacing it.
//   3. Skip-close: if the next char is already the closing char, just move past
//      it instead of inserting a duplicate.
//
const AutoPairExtension = Extension.create({
  name: "autoPair",

  addKeyboardShortcuts() {
    const pairs: Record<string, string> = {
      "{": "}",
      "[": "]",
      "(": ")",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    // Characters that should trigger "skip" when typed over an existing closer
    const closers = new Set(Object.values(pairs));

    const shortcuts: Record<string, (props: { editor: any }) => boolean> = {};

    // ── Opening chars ──
    Object.entries(pairs).forEach(([open, close]) => {
      shortcuts[open] = ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { selection } = state;
        const { from, to, empty } = selection;

        // Wrap selected text
        if (!empty) {
          editor
            .chain()
            .insertContentAt({ from, to }, open + state.doc.textBetween(from, to) + close)
            .setTextSelection({ from: from + 1, to: to + 1 })
            .run();
          return true;
        }

        // Skip-close: if next char is already the closing char, just move past it
        const nextChar = state.doc.textBetween(from, from + 1);
        if (nextChar === close && closers.has(close)) {
          editor.commands.setTextSelection(from + 1);
          return true;
        }

        // Insert pair and place cursor between them
        // insertContent moves cursor to end of inserted text (after close),
        // so we subtract close.length to land between open and close.
        editor
          .chain()
          .insertContentAt(from, open + close)
          .setTextSelection(from + open.length)
          .run();
        return true;
      };
    });

    // ── Backspace: remove closing char if cursor is between a pair ──
    shortcuts["Backspace"] = ({ editor }) => {
      if (!editor.isActive("codeBlock")) return false;

      const { state } = editor;
      const { from, empty } = state.selection;
      if (!empty || from < 2) return false;

      const prevChar = state.doc.textBetween(from - 1, from);
      const nextChar = state.doc.textBetween(from, from + 1);

      if (pairs[prevChar] === nextChar) {
        // Delete both open and close
        editor
          .chain()
          .deleteRange({ from: from - 1, to: from + 1 })
          .run();
        return true;
      }

      return false;
    };

    return shortcuts;
  },
});

// ─── Code block keyboard behaviour ───────────────────────────────────────────
//
// Handles:
//   Enter         → insert newline + preserve leading indentation
//   Tab           → insert 2 spaces at cursor, OR indent all selected lines
//   Shift-Tab     → remove up to 2 spaces from the start of selected lines
//   Mod-/         → toggle line comment (// for most langs, # for python etc.)
//   Mod-Enter       → insert blank line below, cursor moves there
//   Mod-Shift-Enter → insert blank line above, cursor moves there
//   Mod-D           → duplicate current line (falls through outside block → theme toggle)
//   Mod-Shift-K   → delete current line
//   Mod-Z / Y     → undo/redo (Tiptap handles these but we ensure code block
//                   doesn't swallow them)
//
// ─── Helpers ──────────────────────────────────────────────────────────────────
//
// ProseMirror coordinate system inside a code block:
//
//   state.doc is the DOCUMENT tree.  Positions are absolute doc offsets.
//   $pos.parent is the code block TEXT node.
//   $pos.parent.textContent is the FULL text of the code block (all lines).
//   $pos.parentOffset is how many chars into that text node the cursor is.
//
// To find the current line we search backwards/forwards for \n in the
// FULL text string using parentOffset as the cursor position within that
// string.  Then we convert back to doc positions by adding the code block's
// start position.
//
// codeBlockStart = from - $from.parentOffset
// (= the doc position of the first character of the code block content)
//


const INDENT = "  "; // 2 spaces
const INDENT_RE = new RegExp(`^${INDENT}`);

const COMMENT_TOKENS: Record<string, string> = {
  python: "#", ruby: "#", bash: "#", sh: "#", shell: "#",
  yaml: "#", yml: "#", toml: "#", r: "#", perl: "#", powershell: "#",
};

function getCommentToken(language: string): string {
  return COMMENT_TOKENS[language?.toLowerCase()] ?? "//";
}

// ─── Debounced Lowlight Plugin ──────────────────────────────────────────────
//
// The DEFAULT lowlight plugin (from @tiptap/extension-code-block-lowlight)
// re-parses ALL code blocks synchronously on EVERY keystroke, blocking the
// main thread for 5-30ms+. This replacement:
//
//   1. On keystroke: remaps old decorations via position mapping (<0.1ms)
//   2. After 300ms of idle: re-parses and applies fresh decorations
//
// Result: zero-cost typing path, identical highlighting with a tiny delay.

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseHastNodes(
  nodes: any[],
  classNames: string[] = []
): { text: string; classes: string[] }[] {
  return nodes.flatMap((node: any) => {
    const classes = [
      ...classNames,
      ...(node.properties?.className || []),
    ];
    if (node.children) {
      return parseHastNodes(node.children, classes);
    }
    return [{ text: node.value as string, classes }];
  });
}

function computeDecorations(
  doc: any,
  name: string,
  lowlight: any,
  defaultLanguage: string | null | undefined
): DecorationSet {
  const decorations: Decoration[] = [];

  findChildren(doc, (node) => node.type.name === name).forEach((block) => {
    let from = block.pos + 1;
    const language = block.node.attrs.language || defaultLanguage;
    const languages: string[] = lowlight.listLanguages();
    const result =
      language &&
      (languages.includes(language) || lowlight.registered?.(language))
        ? lowlight.highlight(language, block.node.textContent)
        : lowlight.highlightAuto(block.node.textContent);

    const nodes = result.children || result.value || [];

    for (const token of parseHastNodes(nodes)) {
      const to = from + token.text.length;
      if (token.classes.length > 0) {
        decorations.push(
          Decoration.inline(from, to, { class: token.classes.join(" ") })
        );
      }
      from = to;
    }
  });

  return DecorationSet.create(doc, decorations);
}

const LOWLIGHT_PLUGIN_KEY = new PluginKey("lowlight");
const LOWLIGHT_RECOMPUTE = "lowlight-recompute";

function DebouncedLowlightPlugin({
  name,
  lowlight,
  defaultLanguage,
}: {
  name: string;
  lowlight: any;
  defaultLanguage: string | null | undefined;
}) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let editorView: any = null;

  return new Plugin({
    key: LOWLIGHT_PLUGIN_KEY,
    state: {
      init(_, { doc }) {
        return computeDecorations(doc, name, lowlight, defaultLanguage);
      },
      apply(tr, decorationSet) {
        // Our own scheduled recompute — run the real highlighting
        if (tr.getMeta(LOWLIGHT_RECOMPUTE)) {
          return computeDecorations(tr.doc, name, lowlight, defaultLanguage);
        }

        // No doc change — just remap decoration positions
        if (!tr.docChanged) {
          return decorationSet.map(tr.mapping, tr.doc);
        }

        // Doc changed: remap old decorations instantly (zero parsing),
        // then schedule a full recompute during idle time.
        const mapped = decorationSet.map(tr.mapping, tr.doc);

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (editorView) {
            editorView.dispatch(
              editorView.state.tr.setMeta(LOWLIGHT_RECOMPUTE, true)
            );
          }
        }, 300);

        return mapped;
      },
    },
    view(view) {
      editorView = view;
      return {
        update(v: any) {
          editorView = v;
        },
        destroy() {
          editorView = null;
          if (debounceTimer) clearTimeout(debounceTimer);
        },
      };
    },
    props: {
      decorations(state) {
        return LOWLIGHT_PLUGIN_KEY.getState(state);
      },
    },
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── CustomCodeBlock ──────────────────────────────────────────────────────────

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  // Replace the synchronous lowlight plugin with our debounced version.
  // The parent's plugin calls getDecorations() on every keystroke (5-30ms+).
  // Ours remaps old decorations instantly and only re-highlights after 300ms.
  addProseMirrorPlugins() {
    return [
      DebouncedLowlightPlugin({
        name: this.name,
        lowlight: this.options.lowlight,
        defaultLanguage: this.options.defaultLanguage,
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {

      // ── Enter: preserve indentation + smart indent after { [ ( : ──────────
      //
      // The trick: we check if the character BEFORE the cursor (ignoring the
      // auto-paired closer that AutoPair just inserted) is an opener.
      // We do NOT insert a closer here — AutoPair already did that.
      // We just need to insert an extra blank indented line between them and
      // leave the cursor on the inner line.
      //
      // Before (cursor shown as |):
      //   function foo() {|}
      //
      // After Enter:
      //   function foo() {
      //     |
      //   }
      //
      Enter: ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from } = state.selection;

        // ── Read context from the raw document text ──────────────────────────
        // We use $from.parent.textContent (full code block text) and
        // $from.parentOffset (cursor position within that text) — these two
        // are always in the same coordinate space so arithmetic is safe.

        const $from = state.doc.resolve(from);
        const fullText: string = $from.parent.textContent;
        const cursorOffset = $from.parentOffset; // position within fullText

        // Start of the CURRENT line within fullText
        const lineStartOffset = fullText.lastIndexOf("\n", cursorOffset - 1) + 1;

        // Text of the current line up to the cursor
        const textBeforeCursor = fullText.slice(lineStartOffset, cursorOffset);

        // Leading whitespace of current line — this is the indent we preserve
        const indent = textBeforeCursor.match(/^(\s*)/)?.[1] ?? "";

        // Character immediately before and after cursor (in fullText coords)
        const charBefore = cursorOffset > 0 ? fullText[cursorOffset - 1] : "";
        const charAfter = cursorOffset < fullText.length ? fullText[cursorOffset] : "";

        const openerToCloser: Record<string, string> = {
          "{": "}",
          "[": "]",
          "(": ")",
        };

        // Case 1 ── cursor is between a matched pair:  {|}  [|]  (|)
        // AutoPair already placed the closer, so we must NOT add another one.
        // We split the pair across three lines:
        //   {
        //     |        ← cursor lands here
        //   }
        if (openerToCloser[charBefore] === charAfter) {
          // Two newlines: inner indented line + outer line for the closer
          const innerLine = "\n" + indent + INDENT;
          const outerLine = "\n" + indent;

          // Insert both newlines at once. After the insert, the ProseMirror
          // cursor will be at the very end of what was inserted (start of
          // the outer line, just before the existing closer character).
          // We then move it back to the inner line.
          editor.chain().insertContent(innerLine + outerLine).run();

          // Cursor is now sitting right before the existing "}" / "]" / ")"
          // Move it back up to the inner line:
          //   back by outerLine.length  (= 1 + indent.length)
          const newPos = editor.state.selection.from - outerLine.length;
          editor.commands.setTextSelection(newPos);
          return true;
        }

        // Case 2 ── opener at end of line with NO paired closer yet
        //   (user typed { without AutoPair, or Python's :)
        const extraIndent =
          charBefore in openerToCloser || charBefore === ":" ? INDENT : "";

        editor.chain().insertContent("\n" + indent + extraIndent).run();
        return true;
      },

      // ── Tab: indent cursor or all selected lines ───────────────────────────
      //
      // For multi-line selections we MUST snap the range to full line
      // boundaries, otherwise the first and last lines get partially
      // indented and nesting levels go wrong.
      //
      Tab: ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from, to, empty } = state.selection;

        if (empty) {
          editor.commands.insertContent(INDENT);
          return true;
        }

        // Snap from → start of its line, to → end of its line
        const $from = state.doc.resolve(from);
        const $to = state.doc.resolve(to);
        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;

        const fromOffset = $from.parentOffset;
        const toOffset = $to.parentOffset;

        // Snap start to beginning of line
        const snappedFromOffset = fullText.lastIndexOf("\n", fromOffset - 1) + 1;
        // Snap end to end of line
        const nextNL = fullText.indexOf("\n", toOffset);
        const snappedToOffset = nextNL === -1 ? fullText.length : nextNL;

        const snappedFrom = blockStart + snappedFromOffset;
        const snappedTo = blockStart + snappedToOffset;

        const text = fullText.slice(snappedFromOffset, snappedToOffset);
        const indented = text.split("\n").map((l) => INDENT + l).join("\n");

        editor
          .chain()
          .deleteRange({ from: snappedFrom, to: snappedTo })
          .insertContentAt(snappedFrom, indented)
          .setTextSelection({ from: snappedFrom, to: snappedFrom + indented.length })
          .run();
        return true;
      },

      // ── Shift-Tab: dedent current line or selected lines ───────────────────
      "Shift-Tab": ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from, to, empty } = state.selection;

        // ── single line (no selection) ────────────────────────────────────
        if (empty) {
          const $from = state.doc.resolve(from);
          const fullText: string = $from.parent.textContent;
          const blockStart = from - $from.parentOffset;
          const cursorOffset = $from.parentOffset;

          const lineStartOffset = fullText.lastIndexOf("\n", cursorOffset - 1) + 1;
          const lineStartPos = blockStart + lineStartOffset;
          const lineText = fullText.slice(
            lineStartOffset,
            fullText.indexOf("\n", cursorOffset) === -1
              ? fullText.length
              : fullText.indexOf("\n", cursorOffset),
          );
          const indent = lineText.match(/^(\s*)/)?.[1] ?? "";
          const removeCount = Math.min(indent.length, INDENT.length);
          if (removeCount === 0) return true;

          editor
            .chain()
            .deleteRange({ from: lineStartPos, to: lineStartPos + removeCount })
            .run();
          return true;
        }

        // ── multi-line selection — snap to full line boundaries ───────────
        const $from = state.doc.resolve(from);
        const $to = state.doc.resolve(to);
        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;

        const fromOffset = $from.parentOffset;
        const toOffset = $to.parentOffset;

        const snappedFromOffset = fullText.lastIndexOf("\n", fromOffset - 1) + 1;
        const nextNL = fullText.indexOf("\n", toOffset);
        const snappedToOffset = nextNL === -1 ? fullText.length : nextNL;

        const snappedFrom = blockStart + snappedFromOffset;
        const snappedTo = blockStart + snappedToOffset;

        const text = fullText.slice(snappedFromOffset, snappedToOffset);
        const dedented = text.split("\n").map((l) => l.replace(INDENT_RE, "")).join("\n");

        editor
          .chain()
          .deleteRange({ from: snappedFrom, to: snappedTo })
          .insertContentAt(snappedFrom, dedented)
          .setTextSelection({ from: snappedFrom, to: snappedFrom + dedented.length })
          .run();
        return true;
      },

      // ── Mod-/: toggle line comment ─────────────────────────────────────────
      //
      // Always operates on FULL lines — snaps the range to line boundaries
      // before doing anything, so it works correctly whether there is a
      // selection or just a cursor sitting mid-line.
      //
      "Mod-/": ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from, to } = state.selection;
        const language: string = state.selection.$from.parent.attrs?.language ?? "";
        const token = getCommentToken(language);

        // Resolve both ends so we can read parentOffset
        const $from = state.doc.resolve(from);
        const $to   = state.doc.resolve(to);
        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;

        // Snap start → beginning of its line
        const snappedFromOffset =
          fullText.lastIndexOf("\n", $from.parentOffset - 1) + 1;

        // Snap end → end of its line
        const toOffset = $to.parentOffset;
        const nextNL = fullText.indexOf("\n", toOffset);
        const snappedToOffset = nextNL === -1 ? fullText.length : nextNL;

        const snappedFrom = blockStart + snappedFromOffset;
        const snappedTo   = blockStart + snappedToOffset;

        // Operate on the snapped text (full lines only)
        const text = fullText.slice(snappedFromOffset, snappedToOffset);
        const lines = text.split("\n");

        const allCommented = lines.every(
          (l) =>
            l.trimStart().startsWith(token + " ") ||
            l.trimStart().startsWith(token),
        );

        const toggled = lines
          .map((l) => {
            const leadingSpace = l.match(/^(\s*)/)?.[1] ?? "";
            const rest = l.trimStart();
            if (allCommented) {
              const uncommented = rest.startsWith(token + " ")
                ? rest.slice(token.length + 1)
                : rest.slice(token.length);
              return leadingSpace + uncommented;
            }
            return leadingSpace + token + " " + rest;
          })
          .join("\n");

        editor
          .chain()
          .deleteRange({ from: snappedFrom, to: snappedTo })
          .insertContentAt(snappedFrom, toggled)
          // Keep selection covering the toggled lines so repeated Mod-/ works
          .setTextSelection({ from: snappedFrom, to: snappedFrom + toggled.length })
          .run();
        return true;
      },

      // ── Mod-Enter: insert blank line BELOW current line, move cursor there ──
      "Mod-Enter": ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from } = state.selection;
        const $from = state.doc.resolve(from);

        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;
        const cursorOffset = $from.parentOffset;

        // Find end of current line
        const nextNL = fullText.indexOf("\n", cursorOffset);
        const lineEndOffset = nextNL === -1 ? fullText.length : nextNL;
        const lineEndPos = blockStart + lineEndOffset;

        // Preserve current line's indentation on the new line
        const lineStartOffset = fullText.lastIndexOf("\n", cursorOffset - 1) + 1;
        const lineText = fullText.slice(lineStartOffset, lineEndOffset);
        const indent = lineText.match(/^(\s*)/)?.[1] ?? "";

        editor
          .chain()
          .insertContentAt(lineEndPos, "\n" + indent)
          .setTextSelection(lineEndPos + 1 + indent.length)
          .run();
        return true;
      },

      // ── Mod-Shift-Enter: insert blank line ABOVE current line ────────────
      "Mod-Shift-Enter": ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from } = state.selection;
        const $from = state.doc.resolve(from);

        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;
        const cursorOffset = $from.parentOffset;

        // Find start of current line
        const lineStartOffset = fullText.lastIndexOf("\n", cursorOffset - 1) + 1;
        const lineStartPos = blockStart + lineStartOffset;

        // Preserve current line's indentation on the new line
        const nextNL = fullText.indexOf("\n", cursorOffset);
        const lineEndOffset = nextNL === -1 ? fullText.length : nextNL;
        const lineText = fullText.slice(lineStartOffset, lineEndOffset);
        const indent = lineText.match(/^(\s*)/)?.[1] ?? "";

        editor
          .chain()
          .insertContentAt(lineStartPos, indent + "\n")
          .setTextSelection(lineStartPos + indent.length)
          .run();
        return true;
      },

      // ── Mod-d: duplicate current line ─────────────────────────────────────
      //
      // Returns false when NOT in a code block so Ctrl+D falls through to
      // whatever else is bound to it (e.g. your theme toggle handler).
      //
      "Mod-d": ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false; // ← theme toggle fires normally

        const { state } = editor;
        const { from } = state.selection;
        const $from = state.doc.resolve(from);

        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;
        const cursorOffset = $from.parentOffset;

        const lineStartOffset = fullText.lastIndexOf("\n", cursorOffset - 1) + 1;
        const nextNL = fullText.indexOf("\n", cursorOffset);
        const lineEndOffset = nextNL === -1 ? fullText.length : nextNL;

        const lineStartPos = blockStart + lineStartOffset;
        const lineEndPos   = blockStart + lineEndOffset;
        const lineText     = fullText.slice(lineStartOffset, lineEndOffset);

        // Cursor column within the line — preserved on the duplicated line
        const cursorInLine = from - lineStartPos;

        // Insert "\n<lineText>" right after the current line end.
        // Cursor lands on the duplicate at the same column.
        editor
          .chain()
          .insertContentAt(lineEndPos, "\n" + lineText)
          .setTextSelection(lineEndPos + 1 + cursorInLine)
          .run();
        return true;
      },

      // ── Mod-Shift-K: alias for delete line (VS Code muscle memory) ────────
      "Mod-Shift-k": ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;

        const { state } = editor;
        const { from } = state.selection;
        const $from = state.doc.resolve(from);

        const fullText: string = $from.parent.textContent;
        const blockStart = from - $from.parentOffset;
        const cursorOffset = $from.parentOffset;

        const lineStartOffset = fullText.lastIndexOf("\n", cursorOffset - 1) + 1;
        const nextNL = fullText.indexOf("\n", cursorOffset);
        const lineEndOffset = nextNL === -1 ? fullText.length : nextNL;

        const lineStartPos = blockStart + lineStartOffset;
        const lineEndPos = blockStart + lineEndOffset;

        const isOnlyLine = fullText.indexOf("\n") === -1;
        const isLastLine = nextNL === -1;

        if (isOnlyLine) {
          if (lineEndPos > lineStartPos) {
            editor.chain().deleteRange({ from: lineStartPos, to: lineEndPos }).run();
          }
          return true;
        }

        if (isLastLine) {
          editor.chain().deleteRange({ from: lineStartPos - 1, to: lineEndPos }).run();
        } else {
          editor.chain().deleteRange({ from: lineStartPos, to: lineEndPos + 1 }).run();
        }

        return true;
      },

      // ── Escape: exit code block ────────────────────────────────────────────
      Escape: ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;
        const { state } = editor;
        const nodeEnd = state.selection.$from.end(state.selection.$from.depth - 1) + 1;
        editor.commands.setTextSelection(Math.min(nodeEnd, state.doc.content.size));
        return true;
      },

      // ── Backspace: delete matched pair when cursor is between them ─────────
      Backspace: ({ editor }) => {
        if (!editor.isActive("codeBlock")) return false;
        const { state } = editor;
        const { from, empty } = state.selection;
        if (!empty || from < 1) return false;

        const pairs: Record<string, string> = {
          "{": "}", "[": "]", "(": ")", "\"": "\"", "'": "'", "`": "`"
        };
        const prevChar = state.doc.textBetween(Math.max(0, from - 1), from);
        const nextChar = state.doc.textBetween(from, Math.min(from + 1, state.doc.content.size));

        if (pairs[prevChar] === nextChar) {
          editor.chain().deleteRange({ from: from - 1, to: from + 1 }).run();
          return true;
        }
        return false;
      },
    };
  },
}).configure({
  lowlight,
  // When no language is selected, lowlight tries auto-detection across ALL
  // ~190 loaded languages on every keystroke — extremely expensive.
  // Setting a default language prevents this costly auto-detection path.
  defaultLanguage: "plaintext",
});

// ─── Table actions (unchanged from original) ──────────────────────────────────

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
            if (comparison === 0) return a.index - b.index;
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

// ─── Extension list ───────────────────────────────────────────────────────────

export const extensions = [
  Color.configure({ types: [ListItem.name] as string[] }),
  TextStyleKit.configure({ types: [ListItem.name] } as any),
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
    codeBlock: false,
  }),
  CustomCodeBlock,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Underline,
  ListKeymap,
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({ 
    resizable: true,
    cellMinWidth: 90,
  }),
  TableActionsExtension,
  TableRow,
  TableHeader,
  TableCell,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") return "Heading " + node.attrs.level;
      if (node.type.name === "bulletList") return "List";
      if (node.type.name === "orderedList") return "List";
      if (node.type.name === "blockquote") return "Empty quote";
      return "Type / for options";
    },
  }),
  ResizableImageExtension,
  MathExtension.configure({
    blockOptions: {
      onClick: (node: any, pos: number) => {
        window.dispatchEvent(
          new CustomEvent("open-math-dialog", {
            detail: { latex: node.attrs.latex, pos, mode: "block" },
          }),
        );
      },
    },
    inlineOptions: {
      onClick: (node: any, pos: number) => {
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
      class: "cursor-text",
    },
    validate: (href) => /^https?:\/\//.test(href),
  }),
];