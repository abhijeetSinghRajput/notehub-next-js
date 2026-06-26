"use client"

import { useEffect } from "react";
import { ArticleItem } from "@/components/article-item";
import { useNoteStore } from "../stores/useNoteStore";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

const TextPage = () => {
  const { notes, getPublicNotes } = useNoteStore();
  useEffect(() => {
    getPublicNotes({ page: 1, limit: 21 });
  }, []);

  return (
    <div className="max-w-screen overflow-x-clip">
      <div className="container mx-auto px-4">
        <div className="border-x py-8">
          <h2 className="screen-line-top screen-line-bottom ml-4 font-heading text-3xl/none font-medium tracking-tight">
            Blog
          </h2>
          <p className="p-4 text-base text-balance text-muted-foreground">
            A collection of articles on development, design, ideas, and tech
            news.
          </p>
          <div className="screen-line-top relative py-4">
            <div className="pointer-events-none absolute inset-0  grid grid-cols-1 gap-4 max-sm:hidden sm:grid-cols-2 md:grid-cols-3">
              <div className="border-r border-line" />
              <div className="border-l md:border-x" />
              <div className="border-l max-md:hidden" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {notes.map((note) => (
                <ArticleItem
                  key={note._id}
                  note={note}
                />
              ))}
            </div>
          </div>
          <div className="screen-line-top screen-line-bottom flex justify-center py-2">
            <Button className="gap-2 pr-2.5 pl-3" asChild>
              <a href="#">
                View All
                <ArrowRightIcon />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
};

export default TextPage;
