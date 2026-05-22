import { useState, useEffect, useRef, useMemo } from "react";

// ─── Throttle hook ────────────────────────────────────────────────────────────
export function useThrottle<T>(value: T, delay = 800): T {
  const [throttled, setThrottled] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const remaining = delay - (now - lastRan.current);

    if (remaining <= 0) {
      if (timer.current) clearTimeout(timer.current);
      lastRan.current = now;
      setThrottled(value);
    } else {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        lastRan.current = Date.now();
        setThrottled(value);
      }, remaining);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);

  return throttled;
}

export interface SEODiagnostic {
  id: string;
  group: string;
  label: string;
  pass: boolean;
  severity: "error" | "warning" | "info" | "pass";
  message: string;
}

export interface SEOInputData {
  title?: string;
  description?: string;
  slug?: string;
  content?: string;
  keywords?: string[];           // array of individual keyword terms (OR logic)
  images?: { src: string; alt: string; title?: string }[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  author?: string;
  publishDate?: string;
  category?: string;
  tags?: string[];
  seoImageUrl?: string;
}

export interface SEOResult {
  score: number;
  checks: SEODiagnostic[];
  grouped: Record<string, SEODiagnostic[]>;
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    passed: number;
    total: number;
  };
}

// Helper to count whole-word occurrences of a substring (case-insensitive boundary check)
export function countWholeWordOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  let count = 0;
  let pos = lowerText.indexOf(lowerKeyword);
  while (pos !== -1) {
    const charBefore = pos > 0 ? lowerText[pos - 1] : "";
    const charAfter = pos + lowerKeyword.length < lowerText.length ? lowerText[pos + lowerKeyword.length] : "";

    const isBeforeWordChar = /[a-zA-Z0-9_]/.test(charBefore);
    const isAfterWordChar = /[a-zA-Z0-9_]/.test(charAfter);

    if (!isBeforeWordChar && !isAfterWordChar) {
      count++;
    }
    pos = lowerText.indexOf(lowerKeyword, pos + 1);
  }
  return count;
}

// ─── SEO Analysis Engine ──────────────────────────────────────────────────────
export function analyzeSEO(data: SEOInputData): { checks: SEODiagnostic[]; score: number } {
  const checks: SEODiagnostic[] = [];

  const {
    title = "",
    description = "",
    slug = "",
    content = "",
    keywords: rawKeywords = [],
    images = [],
    canonicalUrl = "",
    ogTitle = "",
    ogDescription = "",
    twitterTitle = "",
    twitterDescription = "",
    author = "",
    publishDate = "",
    category = "",
    tags = [],
    seoImageUrl = "",
  } = data;

  // Normalize keyword array — lowercase, deduplicate, ignore blanks
  const keywords = Array.from(
    new Set(rawKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean))
  );
  const keyword = keywords[0] || ""; // primary keyword for display messages
  const primaryKeyword = keywords[0] || "";
  const secondaryKeywords = keywords.slice(1);
  const hasKeywords = keywords.length > 0;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const contentText = content.replace(/<[^>]*>/g, " ").toLowerCase();

  // ── Title checks ─────────────────────────────────────────────────────────
  checks.push({
    id: "title_exists",
    group: "Title",
    label: "Title is present",
    pass: title.trim().length > 0,
    severity: "error",
    message: title.trim().length > 0
      ? `Title: "${title.slice(0, 60)}${title.length > 60 ? "…" : ""}"`
      : "Add a title to your article.",
  });

  const titleLen = title.trim().length;
  checks.push({
    id: "title_length",
    group: "Title",
    label: "Title length (50–60 chars)",
    pass: titleLen >= 50 && titleLen <= 60,
    severity: titleLen < 30 || titleLen > 70 ? "error" : "warning",
    message: `${titleLen} characters. ${titleLen < 50
      ? "Too short — aim for 50–60."
      : titleLen > 60
        ? "Too long — over 60 chars may be truncated in SERPs."
        : "Perfect length."
      }`,
  });

  if (hasKeywords) {
    const titleLower = title.toLowerCase();
    const primaryKeywordInTitle = titleLower.includes(primaryKeyword);

    checks.push({
      id: "title_keyword",
      group: "Title",
      label: "Primary keyword in title",
      pass: primaryKeywordInTitle,
      severity: "error",
      message: primaryKeywordInTitle
        ? `Primary keyword "${primaryKeyword}" found in title.`
        : `Add your primary keyword "${primaryKeyword}" to your title.`,
    });

    const primaryKeywordEarlyInTitle = titleLower.indexOf(primaryKeyword) !== -1 && titleLower.indexOf(primaryKeyword) < 20;
    checks.push({
      id: "title_keyword_position",
      group: "Title",
      label: "Primary keyword near start of title",
      pass: primaryKeywordEarlyInTitle,
      severity: "warning",
      message: primaryKeywordEarlyInTitle
        ? `Primary keyword "${primaryKeyword}" appears early in title — great.`
        : `Move your primary keyword "${primaryKeyword}" closer to the beginning of the title.`,
    });
  }

  // ── Meta Description checks ───────────────────────────────────────────────
  checks.push({
    id: "desc_exists",
    group: "Meta Description",
    label: "Meta description is present",
    pass: description.trim().length > 0,
    severity: "error",
    message: description.trim().length > 0
      ? `Description set.`
      : "Add a meta description.",
  });

  const descLen = description.trim().length;
  checks.push({
    id: "desc_length",
    group: "Meta Description",
    label: "Description length (120–155 chars)",
    pass: descLen >= 120 && descLen <= 155,
    severity: descLen < 80 || descLen > 160 ? "error" : "warning",
    message: `${descLen} characters. ${descLen < 120
      ? "Too short — aim for 120–155 chars."
      : descLen > 155
        ? "Too long — may be truncated in SERPs."
        : "Ideal length."
      }`,
  });

  if (hasKeywords) {
    const descLower = description.toLowerCase();
    const primaryKeywordInDesc = descLower.includes(primaryKeyword);
    checks.push({
      id: "desc_keyword",
      group: "Meta Description",
      label: "Primary keyword in description",
      pass: primaryKeywordInDesc,
      severity: "warning",
      message: primaryKeywordInDesc
        ? `Primary keyword "${primaryKeyword}" found in meta description.`
        : `Include your primary keyword "${primaryKeyword}" in your description.`,
    });
  }

  // ── Slug checks ───────────────────────────────────────────────────────────
  checks.push({
    id: "slug_exists",
    group: "Slug / URL",
    label: "Slug is present",
    pass: slug.trim().length > 0,
    severity: "error",
    message: slug.trim().length > 0 ? `/${slug}` : "Set a URL slug.",
  });

  checks.push({
    id: "slug_format",
    group: "Slug / URL",
    label: "Slug uses lowercase hyphens",
    pass: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
    severity: "error",
    message: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ? "Slug format is valid."
      : "Slug should only contain lowercase letters, numbers, and hyphens.",
  });

  checks.push({
    id: "slug_length",
    group: "Slug / URL",
    label: "Slug length (3–75 chars)",
    pass: slug.length >= 3 && slug.length <= 75,
    severity: "warning",
    message: `${slug.length} characters. ${slug.length < 3
      ? "Too short."
      : slug.length > 75
        ? "Consider shortening the slug."
        : "Good length."
      }`,
  });

  if (hasKeywords) {
    const slugPrimaryKeyword = primaryKeyword.replace(/\s+/g, "-");
    const primaryKeywordInSlug = slug.includes(slugPrimaryKeyword);
    checks.push({
      id: "slug_keyword",
      group: "Slug / URL",
      label: "Primary keyword in slug",
      pass: primaryKeywordInSlug,
      severity: "warning",
      message: primaryKeywordInSlug
        ? `Primary keyword "${primaryKeyword}" found in slug.`
        : `Include your primary keyword "${primaryKeyword}" in your slug.`,
    });
  }

  // ── Content & Heading checks ──────────────────────────────────────────────
  checks.push({
    id: "content_length",
    group: "Content",
    label: "Word count ≥ 300",
    pass: wordCount >= 300,
    severity: wordCount < 150 ? "error" : "warning",
    message: `${wordCount} words. ${wordCount < 300
      ? "Aim for at least 300 words for good indexing."
      : wordCount >= 1000
        ? "Great depth — long-form content ranks well."
        : "Decent length."
      }`,
  });

  if (hasKeywords) {
    // 1. Primary Keyword in Intro (first 100 words)
    const words = contentText.split(/\s+/).filter(Boolean);
    const introText = words.slice(0, 100).join(" ");
    const primaryKeywordInIntro = introText.includes(primaryKeyword);
    checks.push({
      id: "keyword_intro",
      group: "Content",
      label: "Primary keyword in first 100 words",
      pass: primaryKeywordInIntro,
      severity: "warning",
      message: primaryKeywordInIntro
        ? `Primary keyword "${primaryKeyword}" appears early in the content.`
        : `Introduce your primary keyword "${primaryKeyword}" in your opening paragraph (first 100 words).`,
    });

    // 2. Secondary Keywords Natural Usage (1–3 times)
    if (secondaryKeywords.length > 0) {
      const secondaryChecks = secondaryKeywords.map((sk) => {
        const count = countWholeWordOccurrences(contentText, sk);
        return { keyword: sk, count, ok: count >= 1 && count <= 3 };
      });
      const missing = secondaryChecks.filter((sc) => sc.count === 0);
      const overused = secondaryChecks.filter((sc) => sc.count > 3);
      const perfect = secondaryChecks.filter((sc) => sc.ok);

      const secondaryPass = missing.length === 0;

      checks.push({
        id: "secondary_keywords",
        group: "Content",
        label: "Secondary keywords usage (1–3 times)",
        pass: secondaryPass,
        severity: "info",
        message: (() => {
          const parts: string[] = [];
          if (perfect.length > 0) {
            parts.push(`${perfect.length} secondary keyword(s) used naturally: [${perfect.map((p) => `"${p.keyword}" (${p.count}x)`).join(", ")}]`);
          }
          if (missing.length > 0) {
            parts.push(`Missing: [${missing.map((m) => `"${m.keyword}"`).join(", ")}]`);
          }
          if (overused.length > 0) {
            parts.push(`High usage: [${overused.map((o) => `"${o.keyword}" (${o.count}x)`).join(", ")}]`);
          }
          return parts.length > 0 ? parts.join(". ") : "No secondary keywords found in content.";
        })(),
      });
    }
  }

  // Heading counts
  const h1Count = (content.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (content.match(/<h2[\s>]/gi) || []).length;

  checks.push({
    id: "single_h1",
    group: "Content",
    label: "Exactly one H1 heading",
    pass: h1Count === 1,
    severity: "error",
    message:
      h1Count === 0
        ? "No H1 found — add one main heading."
        : h1Count === 1
          ? "One H1 found — great."
          : `${h1Count} H1 tags found — use only one.`,
  });

  checks.push({
    id: "has_h2",
    group: "Content",
    label: "Uses H2 subheadings",
    pass: h2Count >= 2,
    severity: "warning",
    message:
      h2Count === 0
        ? "Add H2 subheadings to structure your content."
        : h2Count === 1
          ? "Add at least one more H2 to improve structure."
          : `${h2Count} H2 headings found.`,
  });

  // ── Heading Hierarchy Accessibility Sequence Checker (h1->h2->h3) ──────────────
  const headingMatches = Array.from(content.matchAll(/<h([1-6])[\s>]/gi));
  const headingLevels = headingMatches.map((m) => parseInt(m[1]));

  let skippedHeading = false;
  let skippedDetails = "";
  let lastLevel = 0;

  for (const level of headingLevels) {
    if (level > lastLevel + 1) {
      skippedHeading = true;
      skippedDetails = `Skipped from H${lastLevel || 1} to H${level}`;
      break;
    }
    lastLevel = level;
  }

  checks.push({
    id: "heading_sequence",
    group: "Content",
    label: "Heading sequence (no skipped levels)",
    pass: !skippedHeading,
    severity: "error",
    message: skippedHeading
      ? `Accessibility issue: Heading levels are skipped (${skippedDetails}). Ensure headings follow a sequential structure (e.g. H1 -> H2 -> H3) without skipping levels for accessibility.`
      : headingLevels.length > 0
        ? "Heading sequential hierarchy is perfectly structured for accessibility."
        : "No headings found to evaluate hierarchy.",
  });

  if (hasKeywords && h2Count > 0) {
    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const primaryKeywordInHeading = headings.some((h) =>
      h.toLowerCase().includes(primaryKeyword)
    );
    checks.push({
      id: "keyword_in_heading",
      group: "Content",
      label: "Primary keyword in heading",
      pass: primaryKeywordInHeading,
      severity: "warning",
      message: primaryKeywordInHeading
        ? `Primary keyword "${primaryKeyword}" found in a heading.`
        : `Use your primary keyword "${primaryKeyword}" in at least one H2 or H3 heading.`,
    });
  }

  // Links
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "notehub-official.vercel.app";

  const internalLinks = (
    content.match(
      new RegExp(`href=["']https?:\/\/${domain.replace(/\./g, "\\.")}[^"']*["']`, "g")
    ) || []
  ).length;

  const externalLinks = (
    content.match(/href=["']https?:\/\/(?!notehub-official\.vercel\.app)[^"']+["']/g) || []
  ).length;

  checks.push({
    id: "internal_links",
    group: "Content",
    label: "Has internal links",
    pass: internalLinks >= 2,
    severity: "warning",
    message: `${internalLinks} internal link${internalLinks !== 1 ? "s" : ""}. ${internalLinks < 2 ? "Add more internal links to related articles." : "Good internal linking."
      }`,
  });

  checks.push({
    id: "external_links",
    group: "Content",
    label: "Has external/authority links",
    pass: externalLinks >= 1,
    severity: "info",
    message: `${externalLinks} external link${externalLinks !== 1 ? "s" : ""}. ${externalLinks < 1 ? "Link to authoritative sources where relevant." : "Good."
      }`,
  });

  // ── Image checks ──────────────────────────────────────────────────────────
  const totalImages = images.length;
  const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0).length;
  const imagesWithKeywordAlt = keyword
    ? images.filter((img) => img.alt && img.alt.toLowerCase().includes(keyword)).length
    : 0;
  const imagesWithTitle = images.filter((img) => img.title && img.title.trim().length > 0).length;

  checks.push({
    id: "has_images",
    group: "Images",
    label: "Article has at least one image",
    pass: totalImages >= 1 || !!seoImageUrl,
    severity: "warning",
    message: (totalImages >= 1 || !!seoImageUrl)
      ? `${totalImages || 1} image${totalImages !== 1 ? "s" : ""} found.`
      : "Add at least one image to improve engagement.",
  });

  if (totalImages > 0) {
    checks.push({
      id: "image_alts",
      group: "Images",
      label: "All images have alt text",
      pass: imagesWithAlt === totalImages,
      severity: "error",
      message:
        imagesWithAlt === totalImages
          ? "All images have alt text."
          : `${totalImages - imagesWithAlt} image${totalImages - imagesWithAlt !== 1 ? "s are" : " is"
          } missing alt text.`,
    });

    if (hasKeywords) {
      const imagesWithPrimaryKeywordAlt = images.filter((img) =>
        img.alt && img.alt.toLowerCase().includes(primaryKeyword)
      ).length;
      checks.push({
        id: "image_alt_keyword",
        group: "Images",
        label: "At least one image alt contains primary keyword",
        pass: imagesWithPrimaryKeywordAlt >= 1,
        severity: "warning",
        message:
          imagesWithPrimaryKeywordAlt >= 1
            ? `${imagesWithPrimaryKeywordAlt} image alt${imagesWithPrimaryKeywordAlt !== 1 ? "s include" : " includes"
            } the primary keyword.`
            : `Include your primary keyword "${primaryKeyword}" in at least one image's alt text.`,
      });
    }

    checks.push({
      id: "image_titles",
      group: "Images",
      label: "Images have title attributes",
      pass: imagesWithTitle === totalImages,
      severity: "info",
      message:
        imagesWithTitle === totalImages
          ? "All images have title attributes."
          : `${totalImages - imagesWithTitle} image${totalImages - imagesWithTitle !== 1 ? "s are" : " is"
          } missing title attributes.`,
    });
  }

  // ── Social / OG checks ────────────────────────────────────────────────────
  checks.push({
    id: "og_title",
    group: "Social (OG)",
    label: "Open Graph title set",
    pass: ogTitle.trim().length > 0,
    severity: "warning",
    message: ogTitle.trim().length > 0
      ? `OG title: "${ogTitle.slice(0, 50)}${ogTitle.length > 50 ? "…" : ""}"`
      : "Set an og:title for social sharing previews.",
  });

  checks.push({
    id: "og_description",
    group: "Social (OG)",
    label: "Open Graph description set",
    pass: ogDescription.trim().length > 0,
    severity: "warning",
    message: ogDescription.trim().length > 0
      ? "OG description set."
      : "Set an og:description for social sharing.",
  });

  checks.push({
    id: "twitter_title",
    group: "Social (Twitter)",
    label: "Twitter/X title set",
    pass: twitterTitle.trim().length > 0,
    severity: "info",
    message: twitterTitle.trim().length > 0
      ? "Twitter/X title set."
      : "Set a twitter:title for better card previews.",
  });

  // ── Technical checks ──────────────────────────────────────────────────────
  checks.push({
    id: "canonical_url",
    group: "Technical",
    label: "Canonical URL set",
    pass: canonicalUrl.trim().length > 0,
    severity: "warning",
    message: canonicalUrl.trim().length > 0
      ? `Canonical: ${canonicalUrl}`
      : "Set a canonical URL to avoid duplicate content issues.",
  });

  checks.push({
    id: "has_author",
    group: "Technical",
    label: "Author is specified",
    pass: author.trim().length > 0,
    severity: "info",
    message: author.trim().length > 0
      ? `Author: ${author}`
      : "Add an author for E-E-A-T signals.",
  });

  checks.push({
    id: "has_date",
    group: "Technical",
    label: "Publish date is set",
    pass: publishDate.trim().length > 0,
    severity: "info",
    message: publishDate.trim().length > 0
      ? `Published: ${publishDate}`
      : "Set a publish date for freshness signals.",
  });

  checks.push({
    id: "has_category",
    group: "Technical",
    label: "Category / topic assigned",
    pass: category.trim().length > 0,
    severity: "info",
    message: category.trim().length > 0
      ? `Category: ${category}`
      : "Assign a category for better site structure.",
  });

  checks.push({
    id: "has_tags",
    group: "Technical",
    label: "Has 3–8 tags",
    pass: tags.length >= 3 && tags.length <= 8,
    severity: "warning",
    message: `${tags.length} tag${tags.length !== 1 ? "s" : ""}. ${tags.length < 3
      ? "Add more descriptive tags."
      : tags.length > 8
        ? "Too many tags — focus on the most relevant."
        : "Good number of tags."
      }`,
  });

  // ── Score calculation ─────────────────────────────────────────────────────
  let penaltyTotal = 0;

  for (const check of checks) {
    if (check.pass) continue;

    switch (check.id) {
      // Title
      case "title_exists":
        penaltyTotal += 25;
        break;
      case "title_length":
        if (title.trim().length > 0) {
          if (titleLen < 30 || titleLen > 70) {
            penaltyTotal += 8;
          } else {
            penaltyTotal += 4;
          }
        }
        break;
      case "title_keyword":
        penaltyTotal += 10;
        break;
      case "title_keyword_position":
        penaltyTotal += 3;
        break;

      // Meta Description
      case "desc_exists":
        penaltyTotal += 15;
        break;
      case "desc_length":
        if (description.trim().length > 0) {
          if (descLen < 80 || descLen > 160) {
            penaltyTotal += 6;
          } else {
            penaltyTotal += 3;
          }
        }
        break;
      case "desc_keyword":
        penaltyTotal += 4;
        break;

      // Slug
      case "slug_exists":
        penaltyTotal += 15;
        break;
      case "slug_format":
        penaltyTotal += 8;
        break;
      case "slug_length":
        penaltyTotal += 3;
        break;
      case "slug_keyword":
        penaltyTotal += 3;
        break;

      // Content
      case "content_length":
        if (wordCount < 150) {
          penaltyTotal += 15;
        } else {
          penaltyTotal += 8;
        }
        break;
      case "keyword_intro":
        penaltyTotal += 3;
        break;
      case "single_h1":
        if (h1Count === 0) {
          penaltyTotal += 20;
        } else {
          penaltyTotal += 8;
        }
        break;
      case "has_h2":
        if (h2Count === 0) {
          penaltyTotal += 10;
        } else {
          penaltyTotal += 5;
        }
        break;
      case "heading_sequence":
        penaltyTotal += 8;
        break;
      case "keyword_in_heading":
        penaltyTotal += 4;
        break;
      case "internal_links":
        if (internalLinks === 0) {
          penaltyTotal += 6;
        } else {
          penaltyTotal += 3;
        }
        break;
      case "external_links":
        penaltyTotal += 4;
        break;

      // Images
      case "has_images":
        penaltyTotal += 5;
        break;
      case "image_alts":
        penaltyTotal += 8;
        break;
      case "image_alt_keyword":
        penaltyTotal += 3;
        break;

      // Social
      case "og_title":
        penaltyTotal += 2;
        break;
      case "og_description":
        penaltyTotal += 2;
        break;

      // Technical
      case "canonical_url":
        if (canonicalUrl.trim().length === 0) {
          penaltyTotal += 4;
        }
        break;
      case "has_tags":
        penaltyTotal += 3;
        break;

      default:
        break;
    }
  }

  // Localhost canonical check: +15 penalty (realistic environment audit)
  if (canonicalUrl.toLowerCase().includes("localhost")) {
    penaltyTotal += 15;
  }

  const score = Math.max(0, 100 - penaltyTotal);

  return { checks, score };
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export function useSEOChecker(data: SEOInputData, throttleMs = 800): SEOResult {
  const throttledData = useThrottle<SEOInputData>(data, throttleMs);

  const result = useMemo(() => analyzeSEO(throttledData), [throttledData]);

  const grouped = useMemo(() => {
    const map: Record<string, SEODiagnostic[]> = {};
    for (const check of result.checks) {
      if (!map[check.group]) map[check.group] = [];
      map[check.group].push(check);
    }
    return map;
  }, [result.checks]);

  const summary = useMemo(() => {
    const errors = result.checks.filter((c) => !c.pass && c.severity === "error").length;
    const warnings = result.checks.filter((c) => !c.pass && c.severity === "warning").length;
    const infos = result.checks.filter((c) => !c.pass && c.severity === "info").length;
    const passed = result.checks.filter((c) => c.pass).length;
    return { errors, warnings, infos, passed, total: result.checks.length };
  }, [result.checks]);

  return {
    score: result.score,
    checks: result.checks,
    grouped,
    summary,
  };
}
