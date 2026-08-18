import { describe, expect, it } from "vitest";
import { extractCity } from "./address";

describe("extractCity", () => {
  it("returns null for missing address", () => {
    expect(extractCity(null)).toBeNull();
  });

  it("extracts city following a Polish postal code", () => {
    expect(extractCity("Wołoska 12, 02-675 Warszawa, Polska")).toBe("Warszawa");
  });

  it("extracts city with a multi-word name", () => {
    expect(extractCity("Rynek 1, 50-101 Wrocław, Polska")).toBe("Wrocław");
  });

  it("falls back to the second-to-last comma segment without a postal code", () => {
    expect(extractCity("ul. Kwiatowa 5, Warszawa")).toBe("Warszawa");
  });

  it("returns null when there is nothing to derive a city from", () => {
    expect(extractCity("Studio Pilates Centrum")).toBeNull();
  });
});
