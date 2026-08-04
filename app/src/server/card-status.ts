import { CardType } from "@/generated/prisma/enums";

export interface ArchivableCard {
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  expiryDate: Date | null;
}

// Formuła z docs/DATABASE.md — `archived` nie jest kolumną, liczona w locie:
// used_visits >= total_visits (dla limit) OR (expiry_date IS NOT NULL AND expiry_date < dziś).
export function isCardArchived(card: ArchivableCard): boolean {
  const limitExhausted =
    card.type === CardType.limit &&
    card.totalVisits != null &&
    card.usedVisits >= card.totalVisits;

  const expired = card.expiryDate != null && card.expiryDate.getTime() < startOfToday().getTime();

  return limitExhausted || expired;
}

// Etykiety dosłownie wg docs/DATABASE.md, sekcja "Status karnetu — progi". `ok`/`soon`/
// `urgent` to ustalone nazwy progów (patrz CLAUDE.md — nie zgadywać innych wartości),
// `wygasł`/`brak terminu` to dodatkowe stany spoza triady, też nazwane wprost w dokumencie.
export type CardWarningStatus = "ok" | "soon" | "urgent" | "wygasł" | "brak terminu";

// Kolejność od najlepszego do najgorszego — używana do wyboru gorszego z dwóch wymiarów.
const STATUS_SEVERITY: Record<CardWarningStatus, number> = {
  ok: 0,
  soon: 1,
  urgent: 2,
  wygasł: 3,
  "brak terminu": -1, // nie bierze udziału w porównaniu (brak tego wymiaru, nie "problem")
};

export interface WarnableCard {
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  expiryDate: Date | null;
}

// Wymiar 1 — data ważności (docs/DATABASE.md): dotyczy `unlimited` zawsze, `limit` jeśli
// ustawiona. `null` u `limit` → "brak terminu" (jedyny przypadek, gdy ten wymiar może być
// pominięty); u `unlimited` expiryDate jest zawsze ustawione (reguła z card-rules.ts).
function getExpiryStatus(card: WarnableCard, today: Date): CardWarningStatus | null {
  if (card.expiryDate == null) {
    return card.type === CardType.limit ? "brak terminu" : null;
  }

  const daysLeft = Math.floor(
    (card.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) return "wygasł";
  if (daysLeft <= 2) return "urgent";
  if (daysLeft <= 7) return "soon";
  return "ok";
}

// Wymiar 2 — pozostałe wejścia (docs/DATABASE.md): dotyczy tylko `limit`.
function getRemainingVisitsStatus(card: WarnableCard): CardWarningStatus | null {
  if (card.type !== CardType.limit || card.totalVisits == null) return null;

  const remaining = card.totalVisits - card.usedVisits;

  if (remaining <= 0) return "wygasł";
  if (remaining === 1) return "urgent";
  if (remaining === 2) return "soon";
  return "ok";
}

// Status ostrzegawczy karnetu — gorszy z dwóch wymiarów, gdy oba mają zastosowanie
// (reguła łączenia z docs/DATABASE.md). `referenceDate` tylko dla testów.
export function getCardWarningStatus(
  card: WarnableCard,
  referenceDate: Date = startOfToday()
): CardWarningStatus {
  const statuses = [getExpiryStatus(card, referenceDate), getRemainingVisitsStatus(card)].filter(
    (status): status is CardWarningStatus => status != null && status !== "brak terminu"
  );

  if (statuses.length === 0) return "brak terminu";

  return statuses.reduce((worst, current) =>
    STATUS_SEVERITY[current] > STATUS_SEVERITY[worst] ? current : worst
  );
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
