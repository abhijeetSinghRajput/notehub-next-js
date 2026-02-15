import { useEffect, useRef, useState, memo, lazy, Suspense, useCallback } from "react";
import Link from "next/link";
import type { EmblaCarouselType } from "embla-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  MoreVertical,
} from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { useNoteStore } from "@/app/stores/useNoteStore";
import NotesOption from "./NotesOption";
import { formatTimeAgo } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useAuthStore } from "@/app/stores/useAuthStore";
import BadgeIcon from "./icons/BadgeIcon";
import { ICollection, INote, IUser } from "@/types/model";

// Lazy load heavy components for better performance
const Accordion = lazy(() =>
  import("./ui/accordion").then((mod) => ({
    default: mod.Accordion,
  })),
);
const AccordionContent = lazy(() =>
  import("./ui/accordion").then((mod) => ({
    default: mod.AccordionContent,
  })),
);
const AccordionItem = lazy(() =>
  import("./ui/accordion").then((mod) => ({
    default: mod.AccordionItem,
  })),
);
const AccordionTrigger = lazy(() =>
  import("./ui/accordion").then((mod) => ({
    default: mod.AccordionTrigger,
  })),
);
const TableOfContent = lazy(() => import("./table-of-content"));

// ==========================================
// TYPE DEFINITIONS
// ==========================================


interface ImageData {
  src: string;
  alt: string;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface CardHeaderContentProps {
  author: IUser;
  isOwner: boolean;
  note: INote;
  collection: ICollection;
  isRenaming: boolean;
  onRename: (value: boolean) => void;
}

interface ImageCarouselProps {
  images: ImageData[];
}

interface TableOfContentsSectionProps {
  headings: Heading[];
}

interface ArticleCardProps {
  note: INote;
  author: IUser;
  images: ImageData[];
  collection: ICollection;
  headings: Heading[];
  description: string;
}

// ==========================================
// MEMOIZED SUB-COMPONENTS
// ==========================================

const CardHeaderContent = memo<CardHeaderContentProps>(
  ({ author, isOwner, note, collection, isRenaming, onRename }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const renameNote = useNoteStore((state) => state.renameNote);

    useEffect(() => {
      if (isRenaming && inputRef.current) {
        const timeout = setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 300);
        return () => clearTimeout(timeout);
      }
    }, [isRenaming]);

    const handleSaveRename = () => {
      const newName = inputRef.current?.value.trim();
      if (newName && newName !== note.name) {
        renameNote({
          noteId: note._id,
          newName,
        });
      }
      onRename(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        handleSaveRename();
      } else if (e.key === "Escape") {
        if (inputRef.current) {
          inputRef.current.value = note.name;
        }
        onRename(false);
      }
    };

    if (isRenaming) {
      return (
        <Input
          ref={inputRef}
          defaultValue={note.name}
          className="font-bold h-8 flex-1"
          onBlur={handleSaveRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <Link
        href={`/${author?.userName}`}
        className="flex flex-row items-center w-max gap-3"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage
            src={author?.avatar}
            alt={author?.fullName || "User Profile Photo"}
          />
          <AvatarFallback>
            {(author?.fullName || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold flex gap-2 items-center text-sm">
            <span>{author?.fullName}</span>
            {author.role === "admin" && (
              <span className="size-4 text-blue-500 flex items-center justify-center">
                <BadgeIcon />
              </span>
            )}
            {isOwner && (
              <Badge
                variant="ghost"
                className="p-1 border-none text-muted-foreground"
              >
                {note.visibility === "public" &&
                collection.visibility === "public" ? (
                  <Globe  className="size-4!" />
                ) : (
                  <Lock
                    className="size-4! fill-destructive/20 stroke-destructive"
                  />
                )}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {`@${author?.userName}`} •{" "}
            {formatTimeAgo(note.contentUpdatedAt?.toString?.() ?? "")}
          </span>
        </div>
      </Link>
    );
  },
);
CardHeaderContent.displayName = "CardHeaderContent";

const ImageCarousel = memo<ImageCarouselProps>(({ images }) => {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [current, setCurrent] = useState(0);
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);
  const [enableCarousel, setEnableCarousel] = useState(false);

  const handleSetApi = useCallback((emblaApi?: EmblaCarouselType) => {
    if (!emblaApi) return;
    setApi(emblaApi);
    // Initialize current slide outside of an effect
    setCurrent(emblaApi.selectedScrollSnap());
  }, []);

  // Defer carousel initialization until after LCP - PERFORMANCE OPTIMIZATION
  useEffect(() => {
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(() => setEnableCarousel(true));
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setEnableCarousel(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!enableCarousel) {
    // Render static image first to avoid layout shift - PERFORMANCE OPTIMIZATION
    return (
      <div className="w-full md:w-[40%] shadow-md border rounded-lg overflow-hidden">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={images[0].src}
            alt={images[0].alt}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full md:w-[40%] shadow-md border rounded-lg overflow-hidden">
        <Carousel className="w-full relative" setApi={handleSetApi}>
          <CarouselContent>
            {images.map((img: ImageData, index: number) => (
              <CarouselItem key={index}>
                <div
                  className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setOpenImageIndex(index)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 hidden sm:flex">
                <ChevronLeft className="h-4 w-4" />
              </CarouselPrevious>
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 hidden sm:flex">
                <ChevronRight className="h-4 w-4" />
              </CarouselNext>

              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {images.map((_: ImageData, index: number) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`w-2 h-2 shadow-md rounded-full transition-all ${
                      current === index
                        ? "bg-primary w-3"
                        : "bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </Carousel>
      </div>

      <Dialog
        open={openImageIndex !== null}
        onOpenChange={(open) => !open && setOpenImageIndex(null)}
      >
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none">
          {openImageIndex !== null && (
            <div className="flex items-center justify-center w-full h-full">
              <img
                src={images[openImageIndex].src}
                alt={images[openImageIndex].alt}
                className="object-contain max-w-full max-h-[80vh]"
                loading="eager"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
ImageCarousel.displayName = "ImageCarousel";

const TableOfContentsSection = memo<TableOfContentsSectionProps>(
  ({ headings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const handleToggle = () => {
      if (!isLoaded) {
        setIsLoaded(true);
      }
      setIsOpen(!isOpen);
    };

    if (!headings || headings.length === 0) return null;

    return (
      <Suspense
        fallback={<div className="h-8 bg-muted animate-pulse rounded" />}
      >
        <Accordion type="single" collapsible className="mb-3 w-full">
          <AccordionItem value="headings" className="border-b-0 w-full">
            <AccordionTrigger
              className="group hover:bg-primary/5 gap-4 py-2 text-sm hover:no-underline"
              onClick={handleToggle}
            >
              <div className="flex group-hover:text-primary items-center gap-2 text-muted-foreground">
                <span>Table of Contents</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-0 w-full">
              {isLoaded && isOpen && <TableOfContent data={headings} />}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Suspense>
    );
  },
);
TableOfContentsSection.displayName = "TableOfContentsSection";

// ==========================================
// MAIN COMPONENT
// ==========================================

export const ArticleCard = memo<ArticleCardProps>(function ArticleCard({
  note,
  author,
  images,
  collection,
  description,
  headings,
}) {
  const authUser = useAuthStore((state) => state.authUser);
  const [isRenaming, setIsRenaming] = useState(false);

  const isOwner = author?.userName === authUser?.userName;

  return (
    <Card className="w-full rounded-xl sm:rounded-2xl border-t border-border lg:border p-4 lg:p-6">
      <CardHeader className="p-0 mb-3 flex flex-row justify-between items-center">
        <CardHeaderContent
          author={author}
          isOwner={isOwner}
          note={note}
          collection={collection}
          isRenaming={isRenaming}
          onRename={setIsRenaming}
        />
        {isOwner && (
          <NotesOption
            trigger={<MoreVertical className="size-4" />}
            className="size-10 rounded-full"
            note={note}
            setIsRenaming={setIsRenaming}
          />
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col items-start md:flex-row gap-4">
          <div className="flex-1 w-full">
            <CardTitle className="text-base sm:text-xl font-semibold mb-2">
              <Link
                href={`/${author?.userName}/${collection.slug}`}
                className="text-muted-foreground hover:underline"
              >
                {collection.name}
              </Link>
              {" / "}
              <Link
                href={`/${author?.userName}/${collection.slug}/${note.slug}`}
                className="hover:underline"
              >
                {note.name}
              </Link>
            </CardTitle>

            <TableOfContentsSection headings={headings} />

            <p
              className="text-muted-foreground text-sm line-clamp-3"
            >
              {description}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-primary/10"
              >
                <Link
                  href={`/${author?.userName}/${collection.slug}/${note.slug}`}
                  className="block w-fit"
                  aria-label={`Read more about ${note.name}`}
                >
                  <span className="sr-only">{`Read more about ${note.name}`}</span>
                  <span aria-hidden="true">Read More</span>
                  <ChevronRight />
                </Link>
              </Button>
            </div>
          </div>

          {images && images.length > 0 && <ImageCarousel images={images} />}
        </div>
      </CardContent>
    </Card>
  );
});
