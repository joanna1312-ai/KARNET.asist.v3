import { CardType } from "@/generated/prisma/enums";

export type CardInputErrorCode =
  | "companyRequired"
  | "typeRequired"
  | "expiryDateRequiredForUnlimited"
  | "totalVisitsRequiredForLimit"
  | "totalVisitsPositive";

export interface CardInputCandidate {
  companyId: string | null | undefined;
  type: CardType | null | undefined;
  totalVisits: number | null | undefined;
  expiryDate: Date | null | undefined;
  // Pole tekstowe (treść/link vouchera) — świadomie bez uploadu pliku/object
  // storage na start (patrz CLAUDE.md), więc bez własnego kodu błędu walidacji.
  // Opcjonalny klucz (nie tylko opcjonalna wartość), żeby nie wymagać go w
  // każdym miejscu budującym kandydata tylko po to, by wyliczyć błędy walidacji.
  voucherFileUrl?: string | null;
}

// Reguła biznesowa (docs/DATABASE.md): `unlimited` ⇒ expiryDate wymagane, `limit` —
// opcjonalnie. Egzekwowana tu, na granicy API, niezależnie od walidacji w UI — nie
// wolno jej stracić przy zmianach w formularzu (patrz CLAUDE.md).
export function getCardInputErrors(
  candidate: CardInputCandidate
): CardInputErrorCode[] {
  const errors: CardInputErrorCode[] = [];

  if (!candidate.companyId) errors.push("companyRequired");
  if (!candidate.type) errors.push("typeRequired");

  if (candidate.type === CardType.unlimited && !candidate.expiryDate) {
    errors.push("expiryDateRequiredForUnlimited");
  }

  if (candidate.type === CardType.limit) {
    if (candidate.totalVisits == null) {
      errors.push("totalVisitsRequiredForLimit");
    } else if (candidate.totalVisits <= 0) {
      errors.push("totalVisitsPositive");
    }
  }

  return errors;
}

function readCardType(value: unknown): CardType | null {
  return value === CardType.limit || value === CardType.unlimited ? value : null;
}

function readTotalVisits(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readExpiryDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readVoucherFileUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// Parsuje ciało żądania POST /api/cards (wszystkie pola nowego karnetu).
export function parseCardInput(body: unknown): CardInputCandidate {
  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  return {
    companyId: typeof record.companyId === "string" ? record.companyId : null,
    type: readCardType(record.type),
    totalVisits: readTotalVisits(record.totalVisits),
    expiryDate: readExpiryDate(record.expiryDate),
    voucherFileUrl: readVoucherFileUrl(record.voucherFileUrl),
  };
}

// Parsuje ciało żądania PATCH /api/cards/:id — tylko pola faktycznie obecne w body
// trafiają do wyniku (rozróżnienie "nie dotykaj" vs "ustaw na null" dla expiryDate,
// zgodnie z docs/API.md: "w tym ustawienie na null").
export function parseCardPatch(body: unknown): Partial<CardInputCandidate> {
  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const patch: Partial<CardInputCandidate> = {};

  if ("companyId" in record) {
    patch.companyId = typeof record.companyId === "string" ? record.companyId : null;
  }
  if ("type" in record) {
    patch.type = readCardType(record.type);
  }
  if ("totalVisits" in record) {
    patch.totalVisits = readTotalVisits(record.totalVisits);
  }
  if ("expiryDate" in record) {
    patch.expiryDate = record.expiryDate === null ? null : readExpiryDate(record.expiryDate);
  }
  if ("voucherFileUrl" in record) {
    patch.voucherFileUrl = readVoucherFileUrl(record.voucherFileUrl);
  }

  return patch;
}
