import { create } from "zustand";

export const FONT_PRESETS = {
  original: "Geist, sans-serif",
  classic: '"Merriweather", serif',
  bookish: '"Lora", serif',
} as const;

export const FONT_SIZE = [
  { value: 0, label: "Small", size: "14px" },
  { value: 1, label: "Medium", size: "16px" },
  { value: 2, label: "Large", size: "18px" },
  { value: 3, label: "Extra Large", size: "20px" },
  { value: 4, label: "Huge", size: "22px" },
] as const;

export type EditorFontSize = (typeof FONT_SIZE)[number];

export interface EditorStoreState {
  openImageDialog: boolean;
  openMathDialog: boolean;
  openLinkDialog: boolean;

  editorFontSizeIndex: number;
  editorFontSize: EditorFontSize | EditorFontSize["size"];
  editorFontFamily: string;

  setFontSize: (index: number) => void;
  setFontFamily: (font: string) => void;
  openDialog: (dialog: "openImageDialog" | "openMathDialog" | "openLinkDialog") => void;
  closeDialog: (dialog: "openImageDialog" | "openMathDialog" | "openLinkDialog") => void;
  closeAllDialogs: () => void;
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  openImageDialog: false,
  openMathDialog: false,
  openLinkDialog: false,

  editorFontSizeIndex: Number(
    typeof window !== "undefined"
      ? window.localStorage.getItem("editorFontSizeIndex") ?? 1
      : 1,
  ),
  editorFontSize: (() => {
    if (typeof window !== "undefined") {
      const storedIndex = window.localStorage.getItem("editorFontSizeIndex");
      const index = storedIndex !== null ? Number(storedIndex) : 1;
      return FONT_SIZE[index] ?? FONT_SIZE[1];
    }
    return FONT_SIZE[1];
  })(),
  editorFontFamily:
    (typeof window !== "undefined"
      ? window.localStorage.getItem("editorFontFamily")
      : null) || "Geist, sans-serif",

  setFontSize: (index) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("editorFontSizeIndex", String(index));
    }
    set({ editorFontSizeIndex: index });
  },

  setFontFamily: (font) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("editorFontFamily", font);
    }
    set({ editorFontFamily: font });
  },

  openDialog: (dialog) => set({ [dialog]: true } as unknown as EditorStoreState),
  closeDialog: (dialog) => set({ [dialog]: false } as unknown as EditorStoreState),

  closeAllDialogs: () =>
    set({
      openImageDialog: false,
      openMathDialog: false,
      openLinkDialog: false,
    }),
}));
