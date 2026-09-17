import { describe, expect, it } from "vitest";
import { safeJsonLdString } from "./json-ld";

describe("safeJsonLdString", () => {
  it("produces valid JSON for normal data", () => {
    const data = { "@type": "Movie", name: "Test Anime" };
    expect(JSON.parse(safeJsonLdString(data))).toEqual(data);
  });

  it("escapes </script> so it can't break out of the containing tag", () => {
    const data = { description: "A show about </script><script>alert(1)</script>" };
    const out = safeJsonLdString(data);
    expect(out).not.toContain("</script>");
    // The escape round-trips back to the original string once parsed —
    // the structured data itself is unaffected, only the raw HTML is safe.
    expect(JSON.parse(out)).toEqual(data);
  });

  it("escapes every '<' character, not just the closing script tag", () => {
    const data = { name: "5 < 10 and <b>bold</b>" };
    const out = safeJsonLdString(data);
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual(data);
  });
});
