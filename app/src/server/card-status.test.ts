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
    realizedVisits: 0,
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
        { type: CardType.limit, totalVisits: null, realizedVisits: 0, expiryDate: null },
        TODAY
      )
    ).toBe("brak terminu");
  });

  it("brak terminu — unlimited bez ustawionej daty ważności (Sesja V6.15 — teraz dozwolone)", () => {
    expect(
      getCardWarningStatus({ ...baseUnlimited, expiryDate: null }, TODAY)
    ).toBe("brak terminu");
  });
});

describe("getCardWarningStatus — wymiar 2: pozostałe wejścia, tylko `limit` (docs/DATABASE.md)", () => {
  const baseLimit = { type: CardType.limit, expiryDate: null };

  it("ok — pozostało więcej niż 2 wejścia", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, realizedVisits: 6 }, TODAY)
    ).toBe("ok");
  });

  it("soon — pozostały dokładnie 2 wejścia", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, realizedVisits: 8 }, TODAY)
    ).toBe("soon");
  });

  it("urgent — pozostało dokładnie 1 wejście", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, realizedVisits: 9 }, TODAY)
    ).toBe("urgent");
  });

  it("wygasł — realized_visits >= total_visits", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, realizedVisits: 10 }, TODAY)
    ).toBe("wygasł");
  });

  it("Sesja V6.3 — nie 'wygasł', gdy limit osiągnięty tylko przyszłymi (niezrealizowanymi) wejściami", () => {
    expect(
      getCardWarningStatus({ ...baseLimit, totalVisits: 10, realizedVisits: 8 }, TODAY)
    ).not.toBe("wygasł");
  });
});

describe("getCardWarningStatus — reguła łączenia: gorszy z dwóch wymiarów (docs/DATABASE.md)", () => {
  it("wymiar wejść gorszy (urgent) niż data (ok) → wynik urgent", () => {
    expect(
      getCardWarningStatus(
        {
          type: CardType.limit,
          totalVisits: 10,
          realizedVisits: 9, // urgent
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
          realizedVisits: 1, // ok
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
          realizedVisits: 8, // soon
          expiryDate: daysFromToday(5), // soon
        },
        TODAY
      )
    ).toBe("soon");
  });
});

describe("isCardArchived — formuła z docs/DATABASE.md (Sesja V6.3: realized_visits, nie used_visits)", () => {
  it("archiwizuje karnet limit z wyczerpanym limitem zrealizowanych wejść", () => {
    expect(
      isCardArchived({
        type: CardType.limit,
        totalVisits: 5,
        realizedVisits: 5,
        expiryDate: null,
      })
    ).toBe(true);
  });

  it("archiwizuje karnet z przeterminowaną datą ważności", () => {
    expect(
      isCardArchived({
        type: CardType.unlimited,
        totalVisits: null,
        realizedVisits: 0,
        expiryDate: daysFromToday(-1),
      })
    ).toBe(true);
  });

  it("Sesja V6.3 — NIE archiwizuje, gdy limit wejść byłby osiągnięty tylko licząc przyszłe (jeszcze niezrealizowane) wejścia", () => {
    // Odpowiednik: totalVisits=5, usedVisits (surowy licznik) już 5, ale tylko 3 wejścia
    // mają datę <= dziś — pozostałe 2 są zaplanowane na przyszłość.
    expect(
      isCardArchived({
        type: CardType.limit,
        totalVisits: 5,
        realizedVisits: 3,
        expiryDate: null,
      })
    ).toBe(false);
  });
});
