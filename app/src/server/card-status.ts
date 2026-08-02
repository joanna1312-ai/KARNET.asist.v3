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

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
