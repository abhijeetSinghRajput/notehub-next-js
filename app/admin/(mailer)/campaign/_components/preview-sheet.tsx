"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PreviewSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  previews: {
    email: string;
    html: string;
    subject: string;
    previewText: string;
  }[];
}

const PreviewSheet = ({ open, onOpenChange, previews }: PreviewSheetProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setIndex(0);
      api?.scrollTo(0);
    }
  }, [open, api]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const current = previews[index];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 w-full sm:max-w-2xl"
      >
        <SheetHeader className="p-0 border-b shrink-0 divide-y">
          <div className="px-4 py-3 pr-10 text-sm">
            <div className="flex justify-between items-center">
              <SheetTitle className="font-medium truncate">
                {current?.subject}
              </SheetTitle>
            </div>
            <p className="text-muted-foreground mt-1 truncate">
              {current?.previewText}
            </p>
          </div>
          {(current?.email || previews.length > 1) && (
            <div className="px-4 py-3 text-xs sm:text-sm flex items-center justify-between font-normal space-y-1 shrink-0">
              <p className="text-muted-foreground truncate">{current?.email}</p>

              {previews.length > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    data-slot="carousel-previous"
                    variant={"outline"}
                    className="size-7"
                    size={"icon"}
                    disabled={index === 0}
                    onClick={() => api?.scrollPrev()}
                  >
                    <ChevronLeft />
                    <span className="sr-only">Previous slide</span>
                  </Button>

                  <p className="text-muted-foreground text-xs w-14 text-center">
                    {index + 1} / {previews.length}
                  </p>

                  <Button
                    data-slot="carousel-previous"
                    variant={"outline"}
                    className="size-7"
                    size={"icon"}
                    disabled={index === previews.length - 1}
                    onClick={() => api?.scrollNext()}
                  >
                    <ChevronRight />
                    <span className="sr-only">Next slide</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <Carousel setApi={setApi} className="h-full">
            <CarouselContent className="h-full ml-0 mt-0">
              {previews.map((preview, i) => (
                <CarouselItem key={i} className="h-full pl-0 basis-full">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 min-h-0">
                      <iframe
                        srcDoc={preview.html}
                        className="w-full h-full border-0 block"
                        title={`Email preview ${i + 1}`}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PreviewSheet;
