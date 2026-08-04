import { CompanyCategory } from "@/generated/prisma/enums";

export type CompanyInputErrorCode = "nameRequired" | "categoryRequired";

export interface CompanyInputCandidate {
  name: string | null | undefined;
  category: CompanyCategory | null | undefined;
}

// Walidacja ręcznego dodania firmy (Sesja 8, docs/API.md: POST /api/companies).
// Współrzędne/google_place_id celowo pomijane tu — to pole pod przyszłą integrację
// Google Places (ADR-004), nieużywane przy ręcznym dodawaniu.
export function getCompanyInputErrors(
  candidate: CompanyInputCandidate
): CompanyInputErrorCode[] {
  const errors: CompanyInputErrorCode[] = [];

  if (!candidate.name || candidate.name.trim().length === 0) {
    errors.push("nameRequired");
  }
  if (!candidate.category) {
    errors.push("categoryRequired");
  }

  return errors;
}

function readCompanyCategory(value: unknown): CompanyCategory | null {
  return (Object.values(CompanyCategory) as string[]).includes(value as string)
    ? (value as CompanyCategory)
    : null;
}

export function parseCompanyInput(body: unknown): CompanyInputCandidate {
  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  return {
    name: typeof record.name === "string" ? record.name.trim() : null,
    category: readCompanyCategory(record.category),
  };
}
