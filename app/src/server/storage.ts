import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klient service-role dla Supabase Storage (Sesja V4.3, ADR-009) — pełny dostęp do
// bucketa, tylko po stronie serwera, nigdy importowany z komponentu klienckiego. Budowany
// leniwie (nie przy imporcie modułu), żeby build/testy nie wywalały się w środowiskach bez
// ustawionych zmiennych STORAGE_* (ten sam wzorzec co GROQ_API_KEY w ai-recommendations.ts).
let cachedClient: SupabaseClient | null = null;

function storageClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.STORAGE_BUCKET_URL;
  const key = process.env.STORAGE_ACCESS_KEY;
  if (!url || !key) {
    throw new Error("storage_not_configured");
  }

  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

function bucketName(): string {
  const name = process.env.STORAGE_BUCKET_NAME;
  if (!name) throw new Error("storage_not_configured");
  return name;
}

// 5 minut — wystarczy na jeden upload albo jedno wyświetlenie podglądu, minimalizuje okno,
// w którym podpisany URL byłby użyteczny, gdyby wyciekł (np. w logach przeglądarki).
const SIGNED_URL_TTL_SECONDS = 300;

export async function createVoucherUploadUrl(path: string): Promise<string> {
  const { data, error } = await storageClient()
    .storage.from(bucketName())
    .createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error("sign_upload_failed");
  return data.signedUrl;
}

export async function createVoucherReadUrl(path: string): Promise<string> {
  const { data, error } = await storageClient()
    .storage.from(bucketName())
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw error ?? new Error("sign_read_failed");
  return data.signedUrl;
}

// Best-effort — wywołujący celowo nie rzuca dalej błędu (patrz miejsca wywołania): brak
// skasowania osieroconego pliku nie powinien blokować zapisu karnetu.
export async function removeVoucherObject(path: string): Promise<void> {
  await storageClient().storage.from(bucketName()).remove([path]);
}
