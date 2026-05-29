import type { Metadata } from "next";
import LinkGraphClient from "./LinkGraphClient";

export const metadata: Metadata = {
  title: "Link Graph · Admin",
  description: "Internal link graph visualizer and SEO health dashboard.",
};

export default function AdminGraphPage() {
  return <LinkGraphClient />;
}