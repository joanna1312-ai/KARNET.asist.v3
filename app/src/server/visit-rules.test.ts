import { describe, expect, it } from "vitest";
import { getVisitInputErrors, parseVisitInput, parseVisitPatch } from "./visit-rules";

describe("parseVisitInput — domyślna data (docs/API.md: dodaj wejście dziś)", () => {
  it("defaults visitDate to today when omitted", () => {
    const candidate = parseVisitInput({});
    const today = new Date().toISOString().slice(0, 10);
    expect(candidate.visitDate?.toISOString().slice(0, 10)).toBe(today);
  });

  it("uses the explicitly provided visitDate", () => {
    const candidate = parseVisitInput({ visitDate: "2026-07-01" });
    expect(candidate.visitDate?.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("parses a valid visitTime", () => {
    const candidate = parseVisitInput({ visitTime: "18:30" });
    expect(candidate.visitTime).not.toBeNull();
  });

  it("treats an invalid visitTime as absent (optional field)", () => {
    const candidate = parseVisitInput({ visitTime: "not-a-time" });
    expect(candidate.visitTime).toBeNull();
  });

  it("trims note and treats an empty string as null", () => {
    expect(parseVisitInput({ note: "  Zapomniałem karty  " }).note).toBe("Zapomniałem karty");
    expect(parseVisitInput({ note: "   " }).note).toBeNull();
  });
});

describe("getVisitInputErrors", () => {
  it("accepts a minimal valid candidate", () => {
    expect(
      getVisitInputErrors({ visitDate: new Date("2026-07-01"), visitTime: null, note: null })
    ).toEqual([]);
  });

  it("rejects a missing/invalid visitDate", () => {
    expect(
      getVisitInputErrors({ visitDate: null, visitTime: null, note: null })
    ).toContain("visitDateInvalid");
  });

  it("rejects a note longer than 80 characters", () => {
    const longNote = "a".repeat(81);
    expect(
      getVisitInputErrors({ visitDate: new Date(), visitTime: null, note: longNote })
    ).toContain("noteTooLong");
  });

  it("accepts a note at exactly 80 characters", () => {
    const note = "a".repeat(80);
    expect(
      getVisitInputErrors({ visitDate: new Date(), visitTime: null, note })
    ).toEqual([]);
  });
});

describe("parseVisitPatch — tylko pola obecne w body (rozróżnienie 'nie dotykaj' vs 'ustaw na null')", () => {
  it("returns an empty patch for an empty body", () => {
    expect(parseVisitPatch({})).toEqual({});
  });

  it("allows explicitly clearing visitTime and note", () => {
    const patch = parseVisitPatch({ visitTime: null, note: null });
    expect(patch).toEqual({ visitTime: null, note: null });
  });

  it("only includes fields present in the body", () => {
    const patch = parseVisitPatch({ note: "Nowa notatka" });
    expect(patch).toEqual({ note: "Nowa notatka" });
  });
});
