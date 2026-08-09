"use client";

import { deviceFetch } from "@/lib/device-client";

// Upload pliku vouchera na kartę (Sesja V4.3, ADR-009) — trzy kroki: 1) poproś serwer o
// podpisany URL do zapisu (autoryzacja + walidacja typu), 2) wyślij plik BEZPOŚREDNIO do
// Supabase Storage tym URL-em (z pominięciem naszej funkcji serverless — limit ciała
// requestu na Vercel ~4.5 MB nie wystarczyłby na plik do 10 MB), 3) potwierdź na serwerze,
// żeby zapisał ścieżkę w `voucherFileUrl`. Zwraca `false` na dowolnym niepowodzeniu —
// wywołujący (CardForm/cards/page.tsx) traktuje to jako błąd nieblokujący: karnet jest już
// zapisany, tylko plik się nie wgrał.
export async function uploadVoucherFile(cardId: string, file: File): Promise<boolean> {
  const signResponse = await deviceFetch(`/api/cards/${cardId}/voucher-file/sign-upload`, {
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

  const confirmResponse = await deviceFetch(`/api/cards/${cardId}/voucher-file/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  return confirmResponse.ok;
}
