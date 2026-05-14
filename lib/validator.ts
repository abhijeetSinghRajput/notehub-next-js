export function isEmail(email: string): boolean {
  if (typeof email !== "string") return false;

  // Basic RFC 5322 compliant regex
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function escape(string: string): string {
  if (typeof string !== "string") return "";

  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true; // null or undefined
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

export function isNumeric(value: unknown): boolean {
  return !isNaN(Number(value)) && !isNaN(parseFloat(String(value)));
}

export function isLength(str: string, { min = 0, max = Infinity }: { min?: number; max?: number } = {}): boolean {
  if (typeof str !== "string") return false;

  const length = str.length;
  return length >= min && length <= max;
}

export function isValidUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;

  try {
    // Try to construct a URL object
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);

    // Check if protocol is http or https
    if (!urlObj.protocol.match(/^https?:$/)) return false;

    // Check if hostname doesn't have spaces
    if (urlObj.hostname.includes(" ")) return false;

    // Check hostname structure
    const hostname = urlObj.hostname;

    // Must have at least one dot
    if (!hostname.includes(".")) return false;

    // Split by dot to check domain parts
    const parts = hostname.split(".");

    // Must have at least 2 parts (domain.tld)
    if (parts.length < 2) return false;

    // Last part (TLD) must be at least 2 characters and not empty
    const tld = parts[parts.length - 1];
    if (!tld || tld.length < 2) return false;

    // Each part should not be empty
    if (parts.some(part => !part)) return false;

    return true;
  } catch {
    return false;
  }
}

export function validateUsername(val: string): { isValid: boolean; error: string } {
  const v = val.trim();

  if (!v) {
    return { isValid: false, error: "Username is required." };
  }

  if (v.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long." };
  }
  const reservedNames = ["admin", "root", "support", "notehub", "system", "api"];

  if (reservedNames.includes(v)) {
    return { isValid: false, error: "Username is reserved." };
  }

  if (/[A-Z]/.test(v)) {
    return { isValid: false, error: "Only lowercase letters are allowed." };
  }

  if (!/^[a-z0-9-]+$/.test(v)) {
    return { isValid: false, error: "Only letters, numbers, and hyphens are allowed." };
  }

  if (v.startsWith("-")) {
    return { isValid: false, error: "Username cannot start with a hyphen." };
  }

  if (v.endsWith("-")) {
    return { isValid: false, error: "Username cannot end with a hyphen." };
  }

  if (v.includes("--")) {
    return { isValid: false, error: "Consecutive hyphens are not allowed." };
  }

  if (v.length > 39) {
    return { isValid: false, error: "Username cannot be longer than 39 characters." };
  }

  return { isValid: true, error: "" };
}

export function validateSlug(val: string): { isValid: boolean; error: string } {
  const v = val.trim();

  if (!v) {
    return { isValid: false, error: "Slug is required." };
  }

  if (/[A-Z]/.test(v)) {
    return { isValid: false, error: "Only lowercase letters are allowed." };
  }

  if (!/^[a-z0-9-]+$/.test(v)) {
    return { isValid: false, error: "Only letters, numbers, and hyphens are allowed." };
  }

  if (v.startsWith("-")) {
    return { isValid: false, error: "Slug cannot start with a hyphen." };
  }

  if (v.endsWith("-")) {
    return { isValid: false, error: "Slug cannot end with a hyphen." };
  }

  if (v.includes("--")) {
    return { isValid: false, error: "Consecutive hyphens are not allowed." };
  }

  if (v.length > 100) {
    return { isValid: false, error: "Slug cannot be longer than 100 characters." };
  }

  return { isValid: true, error: "" };
}
