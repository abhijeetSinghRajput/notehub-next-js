"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

const ScrollTopButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      className="fixed bottom-20 right-4 size-11 rounded-full"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll back to top"
    >
      <ChevronUp className="size-6!" strokeWidth={3} />
    </Button>
  );
};

export default ScrollTopButton;
