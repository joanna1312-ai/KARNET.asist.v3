import { CATEGORY_COLOR_PALETTE, type CategoryColor } from "./system-categories";

export type CategoryInputErrorCode = "nameRequired" | "colorRequired";

export interface CategoryInputCandidate {
  name: string | null | undefined;
  color: CategoryColor | null | undefined;
}

// Walidacja dodania własnej kategorii (Sesja 16, docs/API.md: POST /api/categories).
// Kolor musi pochodzić z zamkniętej palety (decyzja: wybór z gotowej palety, nie
// dowolny color-picker) — egzekwowane też na poziomie bazy przez enum `category_color`.
export function getCategoryInputErrors(
  candidate: CategoryInputCandidate
): CategoryInputErrorCode[] {
  const errors: CategoryInputErrorCode[] = [];

  if (!candidate.name || candidate.name.trim().length === 0) {
    errors.push("nameRequired");
  }
  if (!candidate.color) {
    errors.push("colorRequired");
  }

  return errors;
}

function readCategoryColor(value: unknown): CategoryColor | null {
  return (CATEGORY_COLOR_PALETTE as readonly string[]).includes(value as string)
    ? (value as CategoryColor)
    : null;
}

export function parseCategoryInput(body: unknown): CategoryInputCandidate {
  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  return {
    name: typeof record.name === "string" ? record.name.trim() : null,
    color: readCategoryColor(record.color),
  };
}
