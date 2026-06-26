"use client";

import { memo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import NoteHeader, { type NoteHeaderProps } from "./NoteHeader";
import FloatingActionButtons, {
  type FloatingActionButtonsProps,
} from "./FloatingActionButtons";
import SideNavToc from "./SideNavToc";
import type { INote } from "@/types/model";
import { useNoteInteractions } from "@/hooks/useNoteInteractions";
import RelatedNotes from "./RelatedNotes";
import TopToc from "./TopToc";

const ImageLightbox = dynamic(() => import("@/components/ImageLightbox"), {
  ssr: false,
});
const ScrollTopButton = dynamic(() => import("@/components/ScrollTopButton"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/Footer"));

const MemoScrollTopButton = memo(ScrollTopButton);

export type NoteLayoutProps = {
  note: INote;
  headerProps: NoteHeaderProps;
  fabProps: FloatingActionButtonsProps;
  fontSize: { size: string };
  fontFamily: string;
  selectedImageIndex: number | null;
  noteImages: { src: string; alt: string }[];
  onCloseLightbox: () => void;
  // ── related notes ──────────────────────────────────────────
  relatedNotes?: INote[];
  relatedLoading?: boolean;
};

export default function NoteLayout({
  note,
  headerProps,
  fabProps,
  fontSize,
  fontFamily,
  noteImages,
  relatedNotes = [],
  relatedLoading = false,
}: NoteLayoutProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const containerRef = useNoteInteractions({
    noteImages,
    setSelectedImageIndex,
  });

  const handleCloseLightbox = useCallback(() => setSelectedImageIndex(null), []);

  return (
    <>
      <TopToc {...fabProps} />

      {selectedImageIndex !== null && noteImages.length > 0 && (
        <ImageLightbox
          slides={noteImages}
          index={selectedImageIndex}
          onClose={handleCloseLightbox}
        />
      )}

      <SideNavToc
        toc={fabProps.toc}
        activeId={fabProps.activeId}
        onItemClick={fabProps.handleTocItemClick}
      />

      <div className={cn("h-full flex flex-col justify-between")}>
        <div className="w-full mx-auto relative px-4 max-w-3xl">
          <NoteHeader {...headerProps} />

          <div
            className="tiptap note-view pb-20"
            ref={containerRef}
            style={{
              fontSize: fontSize.size,
              fontFamily: fontFamily,
              lineHeight: "1.7",
              contentVisibility: "auto",
              containIntrinsicSize: "0 3000px",
            }}
            dangerouslySetInnerHTML={{ __html: note?.content || "" }}
          />

          {/* ── Related notes — below fold, zero LCP impact ── */}
          <RelatedNotes notes={relatedNotes} loading={relatedLoading} />

          <FloatingActionButtons {...fabProps} />
        </div>

        <MemoScrollTopButton />
        <Footer className="pb-20 mt-32" />
      </div>
    </>
  );
}