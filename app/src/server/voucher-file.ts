// Reguły uploadu pliku/zdjęcia vouchera (Sesja V4.3, ADR-009). Kolumna `voucherFileUrl`
// pozostaje zwykłym `String?` (patrz DATABASE.md) — plik w object storage odróżnia się od
// zwykłego tekstu/linku (Sesja 11) prefiksem `storage:` przed ścieżką w buckecie.
//
// Moduł celowo bez importów serwerowych (bez sekretów, bez @supabase/supabase-js) — jest
// importowany też z CardForm.tsx (komponent kliencki) po stałe/walidację. Rzeczywiste
// operacje na buckecie (wymagające service-role key) są w @/server/storage.

// Rozmiar i typ pliku są docelowo egzekwowane przez konfigurację bucketa w Supabase
// (allowed MIME types + file size limit) — jedyne miejsce, którego nie da się obejść
// manipulując requestem. Stałe tutaj służą tylko do szybkiej walidacji/feedbacku w UI.
export const VOUCHER_FILE_MAX_BYTES = 10 * 1024 * 1024;

// Limit liczby plików/zdjęć vouchera na karnet (Sesja V6.2) — egzekwowany w API
// (sign-upload + confirm), nie ma odpowiednika na poziomie bazy.
export const VOUCHER_FILE_MAX_COUNT = 5;

export const VOUCHER_FILE_EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const VOUCHER_FILE_ACCEPT = Object.keys(VOUCHER_FILE_EXTENSION_BY_CONTENT_TYPE).join(",");

export function isAllowedVoucherContentType(value: unknown): value is string {
  return typeof value === "string" && value in VOUCHER_FILE_EXTENSION_BY_CONTENT_TYPE;
}

const STORAGE_PREFIX = "storage:";

export function isStorageVoucherFileUrl(
  value: string | null | undefined
): value is string {
  return typeof value === "string" && value.startsWith(STORAGE_PREFIX);
}

export function voucherStoragePath(value: string): string {
  return value.slice(STORAGE_PREFIX.length);
}

export function toStorageVoucherFileUrl(path: string): string {
  return `${STORAGE_PREFIX}${path}`;
}

export function voucherObjectPath(cardId: string, contentType: string): string {
  const ext = VOUCHER_FILE_EXTENSION_BY_CONTENT_TYPE[contentType] ?? "bin";
  return `cards/${cardId}/${crypto.randomUUID()}.${ext}`;
}

// Zapobiega podstawieniem cudzej ścieżki przy potwierdzaniu uploadu (POST .../confirm) i
// chroni pliki odziedziczone przy "Odnów" (renew kopiuje voucherFileUrl karnetu źródłowego
// — patrz cards/page.tsx) przed przypadkowym skasowaniem przy edycji nowego karnetu: taka
// ścieżka NIE jest "własnością" nowego karnetu, więc cleanup jej nie rusza.
export function isVoucherPathOwnedByCard(path: string, cardId: string): boolean {
  return path.startsWith(`cards/${cardId}/`) && !path.includes("..");
}

export function voucherFileKindFromPath(path: string): "image" | "pdf" | null {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") return "image";
  return null;
}
