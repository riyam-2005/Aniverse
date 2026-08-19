/**
 * Input sanitization helpers to prevent XSS attacks across user content
 * such as comments, reviews, bio/name updates, and report reasons.
 */

/**
 * Escapes HTML control characters in raw text strings.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Trims and sanitizes user input, stripping dangerous tags and control chars.
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  // Strip control characters except standard whitespace
  const sanitized = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return sanitizeText(sanitized);
}
