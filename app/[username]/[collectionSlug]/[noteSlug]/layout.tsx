import { Merriweather, Lora } from "next/font/google";
import "@/styles/katex-base.css";
import "@/styles/katex-overrides.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export default function NoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${merriweather.variable} ${lora.variable}`}>
      {children}
    </div>
  );
}