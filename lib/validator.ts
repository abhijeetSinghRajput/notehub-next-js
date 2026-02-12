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
