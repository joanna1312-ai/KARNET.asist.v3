export type VisitInputErrorCode = "visitDateInvalid" | "noteTooLong";

export interface VisitInputCandidate {
  visitDate: Date | null;
  visitTime: Date | null;
  note: string | null;
}

const NOTE_MAX_LENGTH = 80;

// Reguła (docs/DATABASE.md): visitDate zawsze wymagane (domyślnie dziś, gdy nie podano
// jawnie), note — opcjonalne, max ~80 znaków w UI, egzekwowane też tu.
export function getVisitInputErrors(candidate: VisitInputCandidate): VisitInputErrorCode[] {
  const errors: VisitInputErrorCode[] = [];

  if (!candidate.visitDate) errors.push("visitDateInvalid");
  if (candidate.note != null && candidate.note.length > NOTE_MAX_LENGTH) {
    errors.push("noteTooLong");
  }

  return errors;
}

function readVisitDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// "HH:MM" (z <input type="time">) → Date reprezentujący samą porę dnia (kolumna
// @db.Time). Nieparsowalna wartość jest traktowana jak brak godziny — pole jest
// opcjonalne, więc tu nie ma osobnego kodu błędu (analogicznie do expiryDate w
// card-rules.ts dla pól opcjonalnych).
function readVisitTime(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function readNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function todayDateOnly(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

// Parsuje ciało żądania POST /api/cards/:id/visits. Brak visitDate w body → domyślnie
// dziś (zgodnie z docs/API.md: "dodaj wejście (dziś, opcjonalnie z datą/godziną/notatką)").
export function parseVisitInput(body: unknown): VisitInputCandidate {
  const record =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  return {
    visitDate: "visitDate" in record ? readVisitDate(record.visitDate) : todayDateOnly(),
    visitTime: readVisitTime(record.visitTime),
    note: readNote(record.note),
  };
}

// Parsuje ciało żądania PATCH /api/cards/:id/visits/:visitId — tylko pola faktycznie
// obecne w body trafiają do wyniku (rozróżnienie "nie dotykaj" vs "ustaw na null" dla
// visitTime/note, tak jak parseCardPatch w card-rules.ts).
export function parseVisitPatch(body: unknown): Partial<VisitInputCandidate> {
  const record =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const patch: Partial<VisitInputCandidate> = {};

  if ("visitDate" in record) {
    patch.visitDate = readVisitDate(record.visitDate);
  }
  if ("visitTime" in record) {
    patch.visitTime = record.visitTime === null ? null : readVisitTime(record.visitTime);
  }
  if ("note" in record) {
    patch.note = record.note === null ? null : readNote(record.note);
  }

  return patch;
}
