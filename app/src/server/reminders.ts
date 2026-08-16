// Wybór karnetów do przypomnienia push (Etap 6, PWA) — dokładnie 7 i 2 dni przed
// końcem ważności (README.md/PLAN_PRAC.md). Czysta logika oddzielona od zapytania do
// bazy (patrz card-status.ts — ten sam wzorzec), żeby dało się przetestować bez DB.

export const REMINDER_DAYS = [7, 2] as const;
export type ReminderDay = (typeof REMINDER_DAYS)[number];

export interface ReminderCandidate {
  id: string;
  expiryDate: Date | null;
  deletedAt: Date | null;
}

export type WithReminderDay<T> = T & { reminderDay: ReminderDay };

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysUntil(date: Date, referenceDate: Date): number {
  return Math.round((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Dokładnie 7 albo 2 dni do wygaśnięcia — nie "7 lub mniej", żeby przypomnienie
// przyszło raz na próg, nie codziennie aż do wygaśnięcia.
export function getReminderDay(
  card: ReminderCandidate,
  referenceDate: Date = startOfToday()
): ReminderDay | null {
  if (card.deletedAt != null || card.expiryDate == null) return null;
  const days = daysUntil(card.expiryDate, referenceDate);
  return (REMINDER_DAYS as readonly number[]).includes(days) ? (days as ReminderDay) : null;
}

export function filterCardsForReminders<T extends ReminderCandidate>(
  cards: T[],
  referenceDate: Date = startOfToday()
): WithReminderDay<T>[] {
  const result: WithReminderDay<T>[] = [];
  for (const card of cards) {
    const reminderDay = getReminderDay(card, referenceDate);
    if (reminderDay !== null) result.push({ ...card, reminderDay });
  }
  return result;
}
