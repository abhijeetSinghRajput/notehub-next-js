// components/article-card/TocSection.tsx
import { lazy, memo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TableOfContent = lazy(() => import("@/components/table-of-content"));

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TocSectionProps {
  noteLink: string;
  headings: Heading[];
}

export const TocSection = memo<TocSectionProps>(({ noteLink, headings }) => {
  if (!headings?.length) return null;

  return (
    <Accordion type="single" collapsible className="mb-3 w-full">
      <AccordionItem value="headings" className="border-b-0 w-full">
        <AccordionTrigger className="group hover:bg-primary/5 gap-4 py-2 text-sm hover:no-underline">
          <div className="flex group-hover:text-primary items-center gap-2 text-muted-foreground">
            <span>Table of Contents</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-0 w-full">
          <TableOfContent noteLink={noteLink} data={headings} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

TocSection.displayName = "TocSection";