import { describe, expect, it } from "vitest";
import { generateRoomCode } from "./realtime";

describe("Realtime Watch Party Protocol", () => {
  it("generates formatted room codes matching ANI-[mal_id]-[code] pattern", () => {
    const code = generateRoomCode(16498);
    expect(code).toMatch(/^ANI-16498-[A-Z0-9]{4}$/);
  });

  it("produces unique room codes across multiple invocations", () => {
    const code1 = generateRoomCode(5114);
    const code2 = generateRoomCode(5114);
    expect(code1).not.toEqual(code2);
  });
});
