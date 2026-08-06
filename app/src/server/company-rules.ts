export type CompanyInputErrorCode = "nameRequired" | "categoryRequired";

export interface CompanyInputCandidate {
  name: string | null | undefined;
  categoryId: string | null | undefined;
}

// Walidacja ręcznego dodania firmy (Sesja 8, docs/API.md: POST /api/companies).
// Współrzędne/google_place_id celowo pomijane tu — to pole pod przyszłą integrację
// Google Places (ADR-004), nieużywane przy ręcznym dodawaniu.
// Istnienie/widoczność `categoryId` (Sesja 16: kategoria może być systemowa albo
// prywatna dla wywołującego urządzenia) sprawdza route handler przez zapytanie do
// bazy — tu tylko walidacja kształtu wejścia, bez dostępu do bazy.
export function getCompanyInputErrors(
  candidate: CompanyInputCandidate
): CompanyInputErrorCode[] {
  const errors: CompanyInputErrorCode[] = [];

  if (!candidate.name || candidate.name.trim().length === 0) {
    errors.push("nameRequired");
  }
  if (!candidate.categoryId) {
    errors.push("categoryRequired");
  }

  return errors;
}

export function parseCompanyInput(body: unknown): CompanyInputCandidate {
  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  return {
    name: typeof record.name === "string" ? record.name.trim() : null,
    categoryId:
      typeof record.categoryId === "string" && record.categoryId.trim().length > 0
        ? record.categoryId
        : null,
  };
}
