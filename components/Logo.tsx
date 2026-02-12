// components/Logo.tsx
import { cn } from "@/lib/utils";
import { Audiowide } from "next/font/google";

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
});

export default function Logo({className=""}) {
  return (
    <span className={cn(audiowide.className, className)}>
      NoteHub
    </span>
  );
}
