import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ICollection, INote, IUser, PopulatedNote } from "@/types/model";
import { Heading } from "@/components/ArticleCard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  const formattedHours = hours.toString().padStart(2, "0");
  return `${formattedHours}:${minutes} ${ampm}`;
};

// Time formatter
export const formatTimeAgo = (
  date: string | Date,
  // Optional fallback/format argument for future extensibility
  _format?: string,
): string => {
  const targetDate = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor(
    (Date.now() - targetDate.getTime()) / 1000,
  );

  const intervals: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      const label = interval === 1 ? unit : `${unit}s`;
      return `${interval} ${label} ago`;
    }
  }
  return "Just now";
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);

  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
};

export const formatDeviceInfo = (device?: {
  browser?: { name?: string };
  os?: { name?: string };
}): string => {
  if (!device) return "Unknown device";
  return `${device.browser?.name || "Unknown browser"} on ${
    device.os?.name || "Unknown OS"
  }`;
};

export function format(date: Date, pattern: string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");

  const map = {
    yyyy: d.getFullYear(),
    yy: String(d.getFullYear()).slice(-2),
    MMMM: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][d.getMonth()],
    MMM: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][d.getMonth()],
    MM: pad(d.getMonth() + 1),
    M: d.getMonth() + 1,
    dd: pad(d.getDate()),
    d: d.getDate(),
    HH: pad(d.getHours()),
    H: d.getHours(),
    hh: pad(d.getHours() % 12 || 12),
    h: d.getHours() % 12 || 12,
    mm: pad(d.getMinutes()),
    m: d.getMinutes(),
    ss: pad(d.getSeconds()),
    s: d.getSeconds(),
    a: d.getHours() >= 12 ? "PM" : "AM",
  };

  return pattern.replace(
    /yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s|a/g,
    (token) => (map as Record<string, string | number>)[token]?.toString() ?? token,
  );
}

export const formatLocation = (location?: {
  city?: string;
  country?: string;
}): string => {
  if (!location) return "Unknown location";
  return `${location.city || ""}${
    location.city && location.country ? ", " : ""
  }${location.country || ""}`;
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}b`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}m`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return num.toString();
};

export const stripLatex = (text: string): string =>
  text
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();


export type NoteImageMeta = {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export interface NoteTransformResult {
  headings: Heading[];
  images: NoteImageMeta[];
  description: string;
}

export const noteTransformer = (
  htmlContent: string,
  options: {
    headings?: boolean;
    images?: boolean;
    description?: boolean;
  } = { headings: false, images: false, description: false },
): NoteTransformResult => {
  if (!htmlContent || typeof htmlContent !== "string") {
    return {
      headings: [],
      images: [],
      description: "",
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const result: NoteTransformResult = {
      headings: [],
      images: [],
      description: "",
    };

    if (options.headings) {
      const headingElements = doc.querySelectorAll<HTMLHeadingElement>(
        "h1, h2, h3, h4, h5, h6",
      );
      result.headings = Array.from(headingElements)
        .map((heading) => ({
          text: (heading.textContent || "").trim(),
          level: parseInt(heading.tagName.substring(1), 10),
          id: heading.id || "",
        }))
        .filter((h) => h.text.length > 0);
    }

    if (options.images) {
      const imgElements = doc.querySelectorAll<HTMLImageElement>("img[src]");
      result.images = Array.from(imgElements)
        .map((img) => ({
          src: img.src,
          alt: (img.alt || "").trim(),
          width: img.naturalWidth || null,
          height: img.naturalHeight || null,
        }))
        .filter((img) => img.src);
    }

    if (options.description) {
      const textElements = Array.from(
        doc.querySelectorAll<HTMLElement>("p, div, section, article"),
      )
        .map((el) => (el.textContent || "").trim())
        .filter((text) => text.length > 0);

      let bestText = "";
      let maxWordCount = 0;

      for (const text of textElements) {
        const words = text.split(/\s+/);
        const wordCount = words.length;

        if (wordCount >= 20) {
          bestText = words.slice(0, 20).join(" ");
          break;
        }

        if (wordCount > maxWordCount) {
          maxWordCount = wordCount;
          bestText = text;
        }
      }

      if (!bestText && result.headings.length > 0) {
        bestText = result.headings[0].text;
      }

      result.description = stripLatex(bestText);
    }

    return result;
  } catch (error) {
    console.error("Error transforming note content:", error);
    return {
      headings: [],
      images: [],
      description: "",
    };
  }
};

export const noteToArticle = (note: PopulatedNote) => {
  const content = note.content || "";
  const transformed = noteTransformer(content, {
    headings: true,
    images: true,
    description: true,
  });

  let description = "";
  if (transformed.description) {
    description = transformed.description;
  } else if (note.name) {
    description = note.name;
  }

  return {
    ...note,
    article: {
      ...transformed,
      description,
      images: transformed.images || [],
    },
  };
};

/**
 * Basic fuzzy match + scoring
 * Returns -1 if no match
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let score = 0;
  let qIndex = 0;
  let tIndex = 0;
  let consecutive = 0;

  while (qIndex < q.length && tIndex < t.length) {
    if (q[qIndex] === t[tIndex]) {
      qIndex++;
      consecutive++;
      score += 10 + consecutive * 5;
    } else {
      consecutive = 0;
      score -= 1;
    }
    tIndex++;
  }

  if (qIndex !== q.length) return -1;

  if (t.startsWith(q)) score += 20;

  return score;
}

/**
 * Fuzzy filter & sort
 */
export function fuzzyFilter<T extends Record<string, unknown>>(
  query: string,
  items: T[],
  key: keyof T & string = "label",
): T[] {
  if (!query) return items;

  return items
    .map((item) => ({
      item,
      score: fuzzyScore(query, String(item[key] ?? "")),
    }))
    .filter((result) => result.score > -1)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item);
}

// strip HTML tags
export function stripHTML(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export const getCanonicalUrl = (): string => {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";

  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  return `${url.origin}${pathname}`;
};

/**
 * Optimize image URL based on CDN provider (Cloudinary, Google User Content, etc.)
 * @param url - Original image URL
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @returns Optimized image URL with transformation parameters
 */
export function optimizeImageUrl(url: string, width = 280, height = 280): string {
  if (!url) return "";

  try {
    const urlObj = new URL(url);

    // Cloudinary optimization
    if (urlObj.hostname.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_auto:good,f_auto/${parts[1]}`;
      }
    }

    // Google User Content
    if (urlObj.hostname.includes("googleusercontent.com")) {
      const baseUrl = url.split("=s")[0].split("=w")[0];
      return `${baseUrl}=s${width}-c`;
    }

    return url;
  } catch (e) {
    return url;
  }
}