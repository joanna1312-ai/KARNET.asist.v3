export type StatsPeriod = "week" | "month";

export interface DateRange {
  // Inclusive.
  start: Date;
  // Exclusive (start of the next period) — proste porównania `gte`/`lt` w Prisma.
  end: Date;
}

// Tydzień kalendarzowy pon–niedz (nie "ostatnie 7 dni") — ustalone z właścicielką przed
// Sesją V6.7. `getDay()` zwraca 0 dla niedzieli, stąd osobny przypadek.
export function getWeekRange(referenceDate: Date): DateRange {
  const day = referenceDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + diffToMonday
  );
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { start, end };
}

// Miesiąc kalendarzowy (1. do ostatniego dnia), nie "ostatnie 30 dni" — tak samo ustalone.
export function getMonthRange(referenceDate: Date): DateRange {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  return { start, end };
}

export function getPeriodRange(period: StatsPeriod, referenceDate: Date): DateRange {
  return period === "week" ? getWeekRange(referenceDate) : getMonthRange(referenceDate);
}

// Nie `toISOString()` — `start`/`end` tutaj są lokalną północą (jak `startOfToday()`),
// a `toISOString()` przesunąłby je na UTC i w strefach poza UTC zwrócił zły dzień.
export function formatDateOnly(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
