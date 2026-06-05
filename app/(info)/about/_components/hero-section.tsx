import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const HeroSection = () => {
  return (
    <section className="border-b border-border/60 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <Badge variant="secondary" className="mb-4 text-xs font-medium">
          Our story
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5 max-w-2xl leading-tight">
          Born in a classroom.
          <br />
          Built for the world.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
          NoteHub started with a simple frustration — you can't listen and write
          at the same time. So we built a platform where quality notes are
          shared, ranked on Google, and read globally.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Button asChild>
            <Link href="/">
              Browse notes <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
