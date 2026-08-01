/**
 * Safely serializes a JSON-LD object for embedding via
 * dangerouslySetInnerHTML. Plain JSON.stringify() does NOT escape the
 * `</script>` sequence, so a value containing it (a synopsis, a title —
 * this app pulls both from Jikan, a third-party API whose data isn't
 * user-input from *this* app but also isn't guaranteed clean) could break
 * out of the script tag and inject arbitrary markup/script into the page.
 *
 * Escaping `<` as its Unicode escape is the standard mitigation (used by
 * Next.js itself internally for the same reason) — it's valid inside a
 * JSON string and inside a <script> body, and the browser's JSON parser
 * reads `\u003c` identically to a literal `<`, so the structured data
 * itself is unaffected.
 */
export function safeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
