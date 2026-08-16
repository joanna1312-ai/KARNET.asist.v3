import { describe, expect, it } from "vitest";
import { filterCardsForReminders, getReminderDay } from "./reminders";

const TODAY = new Date(2026, 7, 16); // 2026-08-16

function daysFromToday(days: number): Date {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + days);
}

describe("getReminderDay", () => {
  it("zwraca 7 dokładnie 7 dni przed wygaśnięciem", () => {
    expect(getReminderDay({ id: "1", expiryDate: daysFromToday(7), deletedAt: null }, TODAY)).toBe(7);
  });

  it("zwraca 2 dokładnie 2 dni przed wygaśnięciem", () => {
    expect(getReminderDay({ id: "1", expiryDate: daysFromToday(2), deletedAt: null }, TODAY)).toBe(2);
  });

  it("zwraca null dla dni spoza progów (np. 6 albo 1)", () => {
    expect(getReminderDay({ id: "1", expiryDate: daysFromToday(6), deletedAt: null }, TODAY)).toBeNull();
    expect(getReminderDay({ id: "1", expiryDate: daysFromToday(1), deletedAt: null }, TODAY)).toBeNull();
  });

  it("zwraca null bez daty ważności", () => {
    expect(getReminderDay({ id: "1", expiryDate: null, deletedAt: null }, TODAY)).toBeNull();
  });

  it("zwraca null dla usuniętego karnetu, nawet na progu", () => {
    expect(
      getReminderDay({ id: "1", expiryDate: daysFromToday(7), deletedAt: TODAY }, TODAY)
    ).toBeNull();
  });

  it("zwraca null dla karnetu, który już wygasł", () => {
    expect(getReminderDay({ id: "1", expiryDate: daysFromToday(-1), deletedAt: null }, TODAY)).toBeNull();
  });
});

describe("filterCardsForReminders", () => {
  it("filtruje listę, dołączając reminderDay tylko do trafień", () => {
    const cards = [
      { id: "a", expiryDate: daysFromToday(7), deletedAt: null },
      { id: "b", expiryDate: daysFromToday(2), deletedAt: null },
      { id: "c", expiryDate: daysFromToday(5), deletedAt: null },
      { id: "d", expiryDate: null, deletedAt: null },
    ];

    const result = filterCardsForReminders(cards, TODAY);

    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.find((r) => r.id === "a")?.reminderDay).toBe(7);
    expect(result.find((r) => r.id === "b")?.reminderDay).toBe(2);
  });
});
