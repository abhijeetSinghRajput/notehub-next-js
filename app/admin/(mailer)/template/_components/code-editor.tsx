"use client";

import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";


// ─── Shared extensions (stable references — defined outside component) ────────

export const HTML_EXTENSIONS = [html()];
export const JSON_EXTENSIONS = [json()];
export const EDITOR_THEME = oneDark;

const BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  highlightActiveLine: false,
  autocompletion: true,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "html" | "json";
  height?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CodeEditor({
  value,
  onChange,
  language = "html",
  height = "400px",
  className,
}: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={language === "json" ? JSON_EXTENSIONS : HTML_EXTENSIONS}
      theme={EDITOR_THEME}
      height={height}
      className={className}
      basicSetup={BASIC_SETUP}
    />
  );
}