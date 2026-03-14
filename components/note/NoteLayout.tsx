"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import parse from "html-react-parser";
import ImageLightbox from "@/components/ImageLightbox";
import Footer from "@/components/Footer";
import ScrollTopButton from "@/components/ScrollTopButton";
import NoteHeader, { type NoteHeaderProps } from "./NoteHeader";
import FloatingActionButtons, {
  type FloatingActionButtonsProps,
} from "./FloatingActionButtons";
import SideNavToc from "./SideNavToc";
import type { INote } from "@/types/model";

const MemoScrollTopButton = memo(ScrollTopButton);
const MemoFooter = memo(Footer);

export type NoteLayoutProps = {
  note: INote;
  /** Props forwarded to NoteHeader. */
  headerProps: NoteHeaderProps;
  /** Props forwarded to FloatingActionButtons. */
  fabProps: FloatingActionButtonsProps;
  /** Editor font settings. */
  fontSize: { size: string };
  fontFamily: string;
  /** Lightbox state. */
  selectedImageIndex: number | null;
  noteImages: { src: string; alt: string }[];
  onCloseLightbox: () => void;
};

/**
 * Shared layout for both the owner note page and the public note page.
 * Renders: lightbox, header, title (h1), content, floating action buttons,
 * scroll-top button, and footer.
 */
export default function NoteLayout({
  note,
  headerProps,
  fabProps,
  fontSize,
  fontFamily,
  selectedImageIndex,
  noteImages,
  onCloseLightbox,
}: NoteLayoutProps) {
  return (
    <>
      {selectedImageIndex !== null && noteImages.length > 0 && (
        <ImageLightbox
          slides={noteImages}
          index={selectedImageIndex}
          onClose={onCloseLightbox}
        />
      )}

      {/* ── Side-rail TOC (lg+ screens) ── */}
      <SideNavToc
        toc={note?.tableOfContent ?? []}
        activeId={fabProps.activeId}
        onItemClick={fabProps.handleTocItemClick}
      />

      <div className={cn("h-full flex flex-col justify-between")}>
        <div className="max-w-3xl w-full mx-auto relative">
          {/* ── Note header ── */}
          <NoteHeader {...headerProps} />

          {/* ── Note title ── */}
          <h1 className="sr-only">
            {note?.name || "Untitled Note"}
          </h1>

          {/* ── Note content ── */}
          <div
            className="tiptap"
            style={{
              fontSize: fontSize.size,
              fontFamily,
              lineHeight: "1.7",
            }}
          >
            {parse(note?.content || "")}
          </div>

          {/* ── Floating actions ── */}
          <FloatingActionButtons {...fabProps} />
        </div>

        <MemoScrollTopButton />
        <MemoFooter className="pb-28" />
      </div>
    </>
  );
}
