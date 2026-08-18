import { describe, expect, it } from "vitest";
import { getMonthRange, getPeriodRange, getWeekRange } from "./stats-rules";

// Formatuje z lokalnych składowych, nie `toISOString()` — daty tutaj powstają jako
// lokalna północ (`new Date(rok, miesiąc, dzień)`, tak jak `startOfToday()`), a
// `toISOString()` przesunąłby je na UTC, co w strefach na wschód/zachód od UTC
// dawałoby błędny dzień niezależnie od strefy maszyny uruchamiającej testy.
function isoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("getWeekRange — kalendarzowo, pon–niedz (Sesja V6.7)", () => {
  it("środa — tydzień zaczyna się w poniedziałek tego samego tygodnia", () => {
    const { start, end } = getWeekRange(new Date(2026, 7, 19)); // środa, 2026-08-19
    expect(isoDate(start)).toBe("2026-08-17"); // poniedziałek
    expect(isoDate(end)).toBe("2026-08-24"); // kolejny poniedziałek (exclusive)
  });

  it("poniedziałek — sam jest początkiem swojego tygodnia", () => {
    const { start, end } = getWeekRange(new Date(2026, 7, 17));
    expect(isoDate(start)).toBe("2026-08-17");
    expect(isoDate(end)).toBe("2026-08-24");
  });

  it("niedziela — należy do tygodnia, który zaczął się w poprzedni poniedziałek", () => {
    const { start, end } = getWeekRange(new Date(2026, 7, 23));
    expect(isoDate(start)).toBe("2026-08-17");
    expect(isoDate(end)).toBe("2026-08-24");
  });

  it("tydzień przechodzący przez granicę miesiąca", () => {
    const { start, end } = getWeekRange(new Date(2026, 8, 1)); // wtorek, 2026-09-01
    expect(isoDate(start)).toBe("2026-08-31");
    expect(isoDate(end)).toBe("2026-09-07");
  });
});

describe("getMonthRange — kalendarzowo, 1. do ostatniego dnia (Sesja V6.7)", () => {
  it("zwraca pierwszy dzień bieżącego i pierwszy dzień następnego miesiąca", () => {
    const { start, end } = getMonthRange(new Date(2026, 7, 19));
    expect(isoDate(start)).toBe("2026-08-01");
    expect(isoDate(end)).toBe("2026-09-01");
  });

  it("grudzień — koniec zakresu przechodzi na styczeń kolejnego roku", () => {
    const { start, end } = getMonthRange(new Date(2026, 11, 15));
    expect(isoDate(start)).toBe("2026-12-01");
    expect(isoDate(end)).toBe("2027-01-01");
  });
});

describe("getPeriodRange", () => {
  it("deleguje do getWeekRange dla \"week\"", () => {
    const reference = new Date(2026, 7, 19);
    expect(getPeriodRange("week", reference)).toEqual(getWeekRange(reference));
  });

  it("deleguje do getMonthRange dla \"month\"", () => {
    const reference = new Date(2026, 7, 19);
    expect(getPeriodRange("month", reference)).toEqual(getMonthRange(reference));
  });
});
