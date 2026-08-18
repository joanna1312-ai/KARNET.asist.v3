"use client";

import { deviceFetch } from "@/lib/device-client";

// Upload pliku vouchera na kartę (Sesja V4.3, ADR-009; ścieżki przeniesione pod
// voucher-files w Sesji V6.2) — trzy kroki: 1) poproś serwer o podpisany URL do zapisu
// (autoryzacja + walidacja typu + limit liczby plików), 2) wyślij plik BEZPOŚREDNIO do
// Supabase Storage tym URL-em (z pominięciem naszej funkcji serverless — limit ciała
// requestu na Vercel ~4.5 MB nie wystarczyłby na plik do 10 MB), 3) potwierdź na serwerze,
// żeby dodał wiersz `CardVoucherFile`. Zwraca `false` na dowolnym niepowodzeniu —
// wywołujący traktuje to jako błąd nieblokujący: karnet jest już zapisany, tylko plik się
// nie wgrał.
export async function uploadVoucherFile(cardId: string, file: File): Promise<boolean> {
  const signResponse = await deviceFetch(`/api/cards/${cardId}/voucher-files/sign-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type }),
  });
  if (!signResponse.ok) return false;

  const { uploadUrl, path }: { uploadUrl: string; path: string } = await signResponse.json();

  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putResponse.ok) return false;

  const confirmResponse = await deviceFetch(`/api/cards/${cardId}/voucher-files/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  return confirmResponse.ok;
}

// Wgrywa kilka plików po kolei (nie równolegle — każdy zależy od świeżego sprawdzenia
// limitu w sign-upload) — używane, gdy formularz karnetu ma kilka nowych plików czekających
// na wgranie naraz (Sesja V6.2). Zwraca liczbę plików, które się NIE wgrały, żeby
// wywołujący mógł pokazać błąd nieblokujący bez przerywania reszty uploadów.
export async function uploadVoucherFiles(cardId: string, files: File[]): Promise<number> {
  let failed = 0;
  for (const file of files) {
    const ok = await uploadVoucherFile(cardId, file);
    if (!ok) failed += 1;
  }
  return failed;
}

// Usuwa jeden już wgrany plik vouchera (Sesja V6.2) — używane przy kliknięciu "Usuń" na
// miniaturce w siatce plików.
export async function deleteVoucherFile(cardId: string, fileId: string): Promise<boolean> {
  const response = await deviceFetch(`/api/cards/${cardId}/voucher-files/${fileId}`, {
    method: "DELETE",
  });
  return response.ok;
}

export interface VoucherFile {
  id: string;
  url: string;
  kind: "image" | "pdf" | null;
}

// Świeże podpisane URL-e wszystkich plików vouchera karnetu (Sesja V6.2) — do wyświetlenia
// siatki miniaturek w formularzu edycji i w szczegółach karnetu.
export async function fetchVoucherFiles(cardId: string): Promise<VoucherFile[]> {
  const response = await deviceFetch(`/api/cards/${cardId}/voucher-files`);
  if (!response.ok) return [];
  const body: { files: VoucherFile[] } = await response.json();
  return body.files;
}
