import { describe, expect, it } from "vitest";
import { CardType } from "@/generated/prisma/enums";
import { getCardWarningStatus, isCardArchived } from "./card-status";

const TODAY = new Date(2026, 7, 4); // 2026-08-04, tak jak referenceDate domyślne

function daysFromToday(days: number): Date {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + days);
}

describe("getCardWarningStatus — wymiar 1: data ważności (docs/DATABASE.md)", () => {
  const baseUnlimited = {
    type: CardType.unlimited,
    totalVisits: null,
    usedVisits: 0,
  };

  it("ok — więcej niż 7 dni do wygaśnięcia", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: daysFromToday(8) }, TODAY)
    ).toBe("ok");
  });

  it("soon — dokładnie 7 dni do wygaśnięcia (granica górna)", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: daysFromToday(7) }, TODAY)
    ).toBe("soon");
  });

  it("soon — dokładnie 3 dni do wygaśnięcia (granica dolna)", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: daysFromToday(3) }, TODAY)
    ).toBe("soon");
  });

  it("urgent — dokładnie 2 dni do wygaśnięcia (granica górna)", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: daysFromToday(2) }, TODAY)
    ).toBe("urgent");
  });

  it("urgent — 0 dni do wygaśnięcia (dziś)", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: daysFromToday(0) }, TODAY)
    ).toBe("urgent");
  });

  it("wygasł — data minęła wczoraj", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: daysFromToday(-1) }, TODAY)
    ).toBe("wygasł");
  });

  it("brak terminu — limit bez ustawionej daty ważności i bez limitu wejść", () => {
    expect(
      getCardWarningStatus(
        { type: CardType.limit, totalVisits: null, usedVisits: 0, expiryDate: null },
        TODAY
      )
    ).toBe("brak terminu");
  });
});

describe("getCardWarningStatus — wymiar 2: pozostałe wejścia, tylko `limit` (docs/DATABASE.md)", () => {
  const baseLimit = { type: CardType.limit, expiryDate: null };

  it("ok — pozostało więcej niż 2 wejścia", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, usedVisits: 6 }, TODAY)
    ).toBe("ok");
  });

  it("soon — pozostały dokładnie 2 wejścia", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, usedVisits: 8 }, TODAY)
    ).toBe("soon");
  });

  it("urgent — pozostało dokładnie 1 wejście", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, usedVisits: 9 }, TODAY)
    ).toBe("urgent");
  });

  it("wygasł — used_visits >= total_visits", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, usedVisits: 10 }, TODAY)
    ).toBe("wygasł");
  });
});

describe("getCardWarningStatus — reguła łączenia: gorszy z dwóch wymiarów (docs/DATABASE.md)", () => {
  it("wymiar wejść gorszy (urgent) niż data (ok) → wynik urgent", () => {
    expect(
      getCardWarningStatus(
        {
          type: CardType.limit,
          totalVisits: 10,
          usedVisits: 9, // urgent
          expiryDate: daysFromToday(30), // ok
        },
        TODAY
      )
    ).toBe("urgent");
  });

  it("wymiar daty gorszy (wygasł) niż wejść (ok) → wynik wygasł", () => {
    expect(
      getCardWarningStatus(
        {
          type: CardType.limit,
          totalVisits: 10,
          usedVisits: 1, // ok
          expiryDate: daysFromToday(-1), // wygasł
        },
        TODAY
      )
    ).toBe("wygasł");
  });

  it("oba wymiary soon → wynik soon", () => {
    expect(
      getCardWarningStatus(
        {
          type: CardType.limit,
          totalVisits: 10,
          usedVisits: 8, // soon
          expiryDate: daysFromToday(5), // soon
        },
        TODAY
      )
    ).toBe("soon");
  });
});

describe("isCardArchived — bez zmian, formuła z docs/DATABASE.md", () => {
  it("archiwizuje karnet limit z wyczerpanym limitem wejść", () => {
    expect(
      isCardArchived({
        type: CardType.limit,
        totalVisits: 5,
        usedVisits: 5,
        expiryDate: null,
      })
    ).toBe(true);
  });

  it("archiwizuje karnet z przeterminowaną datą ważności", () => {
    expect(
      isCardArchived({
        type: CardType.unlimited,
        totalVisits: null,
        usedVisits: 0,
        expiryDate: daysFromToday(-1),
      })
    ).toBe(true);
  });
});
