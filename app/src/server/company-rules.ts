export type CompanyInputErrorCode = "nameRequired" | "categoryRequired" | "locationIncomplete";

export interface CompanyInputCandidate {
  name: string | null | undefined;
  categoryId: string | null | undefined;
  lat?: number | null;
  lng?: number | null;
  googlePlaceId?: string | null;
}

// Walidacja ręcznego dodania firmy (Sesja 8, docs/API.md: POST /api/companies).
// lat/lng/googlePlaceId (Sesja V4.1, ADR-004) są opcjonalne — ręczne dodanie firmy bez
// wyboru podpowiedzi Google Places nadal działa, tak jak przed integracją. Jedyna reguła:
// lat i lng muszą przyjść razem (albo oba, albo żadne) — połówkowa lokalizacja to zawsze
// błąd danych, nie stan pośredni.
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
  if ((candidate.lat == null) !== (candidate.lng == null)) {
    errors.push("locationIncomplete");
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
    lat: typeof record.lat === "number" && Number.isFinite(record.lat) ? record.lat : null,
    lng: typeof record.lng === "number" && Number.isFinite(record.lng) ? record.lng : null,
    googlePlaceId:
      typeof record.googlePlaceId === "string" && record.googlePlaceId.trim().length > 0
        ? record.googlePlaceId
        : null,
  };
}
