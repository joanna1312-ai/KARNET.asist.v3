import { prisma } from "@/lib/db";
import { ownerFilter } from "@/server/card-owner";
import type { CallerIdentity } from "@/server/caller-identity";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const NEARBY_RADIUS_METERS = 5000;
const MAX_NEARBY_PLACES = 10;
const CACHE_TTL_MS = 60 * 60 * 1000;
// Zaokrąglenie współrzędnych do siatki ok. 1 km — pozycja z geolokalizacji ma dużo miejsc
// po przecinku i praktycznie nigdy się nie powtórzy co do metra; bez zaokrąglenia cache
// nigdy by nie trafiał.
const CACHE_COORD_PRECISION = 2;

// Prosty cache w pamięci procesu (Sesja V4.2b) dla wyników Google Places — te nie zależą
// od tego, kto pyta. Odpowiedź Groq celowo NIE jest cache'owana — zależy od historii
// karnetów konkretnego wywołującego, więc współdzielenie jej między użytkownikami byłoby
// wyciekiem cudzych spersonalizowanych sugestii. Uwaga: to cache per-proces, nie
// współdzielony między instancjami serverless (Vercel) ani między cold startami — pomaga w
// dev i w seriach żądań na tym samym "ciepłym" procesie, nie jest docelowym rozwiązaniem na
// produkcyjną skalę (wtedy: Redis/Vercel KV).
function createTtlCache<T>() {
  const store = new Map<string, { value: T; expiresAt: number }>();
  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T) {
      store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    },
    clear() {
      store.clear();
    },
  };
}

const nearbyPlacesCache = createTtlCache<NearbyPlace[]>();

// Wyłącznie do testów — cache w pamięci procesu inaczej przeciekałby między przypadkami
// testowymi (moduł importowany raz na plik testowy).
export function __resetAiRecommendationsCacheForTests() {
  nearbyPlacesCache.clear();
}

export type RecommendationLocale = "pl" | "en";

export interface RecommendationInput {
  lat: number;
  lng: number;
  categoryId?: string;
  categoryName?: string;
  locale: RecommendationLocale;
}

export interface RecommendationItem {
  name: string;
  reason: string;
  mapsUrl?: string;
}

export interface RecommendationResult {
  recommendations: RecommendationItem[];
  relatedSuggestions: RecommendationItem[];
}

interface NearbyPlace {
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  address: string | null;
  googleMapsUri: string | null;
}

// Google Places API (New) Text Search zamiast Nearby Search — akceptuje dowolny tekst
// zapytania, więc działa też dla kategorii własnych użytkownika (Sesja 16), nie tylko
// 5 systemowych z ich stałym zbiorem Google "types" (którego i tak nie dałoby się
// niezawodnie zmapować 1:1 na nasze kategorie). `googleMapsUri` przychodzi wprost w tej
// samej odpowiedzi — link do profilu miejsca na Google Maps nie wymaga osobnego wywołania.
async function fetchNearbyPlaces(input: RecommendationInput): Promise<NearbyPlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY;
  if (!apiKey) return [];

  const cacheKey = [
    input.lat.toFixed(CACHE_COORD_PRECISION),
    input.lng.toFixed(CACHE_COORD_PRECISION),
    input.categoryName ?? "",
    input.locale,
  ].join(":");
  const cached = nearbyPlacesCache.get(cacheKey);
  if (cached) return cached;

  const textQuery = input.categoryName
    ? `${input.categoryName} w pobliżu`
    : "ciekawe miejsca i aktywności w pobliżu";

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: input.locale,
      maxResultCount: MAX_NEARBY_PLACES,
      locationBias: {
        circle: {
          center: { latitude: input.lat, longitude: input.lng },
          radius: NEARBY_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`places_error_${response.status}`);
  }

  const body: {
    places?: {
      displayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
      formattedAddress?: string;
      googleMapsUri?: string;
    }[];
  } = await response.json();

  const places = (body.places ?? [])
    .filter((place) => Boolean(place.displayName?.text))
    .map((place) => ({
      name: place.displayName!.text!,
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
      address: place.formattedAddress ?? null,
      googleMapsUri: place.googleMapsUri ?? null,
    }));

  nearbyPlacesCache.set(cacheKey, places);
  return places;
}

// Dołącza link do profilu Google Maps tylko do miejsc, które Groq faktycznie polecił w
// sekcji "recommendations" (nie "relatedSuggestions" — to zwykle własne, dotychczasowe
// firmy użytkownika, bez gwarancji dopasowania do wyniku Google Places), i tylko dla tych,
// które da się jednoznacznie dopasować po nazwie do wyniku wyszukiwania.
function attachMapsLinks(result: RecommendationResult, nearbyPlaces: NearbyPlace[]): RecommendationResult {
  const byName = new Map(nearbyPlaces.map((place) => [place.name.toLowerCase(), place]));

  const recommendations = result.recommendations.map((item) => {
    const match = byName.get(item.name.toLowerCase());
    return match?.googleMapsUri ? { ...item, mapsUrl: match.googleMapsUri } : item;
  });

  return { ...result, recommendations };
}

// Historia karnetów wywołującego (konto albo urządzenie, ownerFilter jak w /api/cards) —
// tylko nazwa firmy + kategoria, żadnych danych osobowych, jako kontekst dla Groq.
async function fetchHistoryCompanyNames(identity: CallerIdentity): Promise<string[]> {
  const cards = await prisma.card.findMany({
    where: { deletedAt: null, ...ownerFilter(identity) },
    select: { company: { select: { name: true, category: { select: { name: true } } } } },
  });

  const names = new Map<string, string>();
  for (const card of cards) {
    names.set(card.company.name, `${card.company.name} (${card.company.category.name})`);
  }
  return [...names.values()];
}

function buildPrompt(
  input: RecommendationInput,
  nearbyPlaces: NearbyPlace[],
  historyCompanyNames: string[]
): { system: string; user: string } {
  const languageName = input.locale === "pl" ? "Polish" : "English";

  const system = [
    "You are an advisor inside KARNET.asist, an app that helps people track passes/vouchers",
    "for gyms, pools, group classes, massages and beauty treatments.",
    "You will get a list of real nearby places (from Google Places) and a list of",
    "companies where the user already holds a pass.",
    "Task: (1) pick the most worth-recommending places from the nearby list, favoring",
    "higher rating and more ratings; (2) suggest what else might interest the user given",
    "their existing passes.",
    "Hard rule: only ever reference place names that literally appear in the nearby list",
    "or the history list below — never invent a name. If nothing fits a section, return",
    `an empty array for it. Write every "reason" value in ${languageName}.`,
    'Respond with ONLY a JSON object of this exact shape, no extra text:',
    '{"recommendations":[{"name":string,"reason":string}],"relatedSuggestions":[{"name":string,"reason":string}]}',
  ].join(" ");

  const user = JSON.stringify({
    nearbyPlaces: nearbyPlaces.map((place) => ({
      name: place.name,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      address: place.address,
    })),
    userExistingPasses: historyCompanyNames,
  });

  return { system, user };
}

function toItemArray(value: unknown): RecommendationItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : "",
      reason: typeof item.reason === "string" ? item.reason : "",
    }))
    .filter((item) => item.name !== "");
}

function normalizeGroqResult(parsed: unknown): RecommendationResult | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  const recommendations = toItemArray(obj.recommendations);
  const relatedSuggestions = toItemArray(obj.relatedSuggestions);
  if (recommendations.length === 0 && relatedSuggestions.length === 0) return null;
  return { recommendations, relatedSuggestions };
}

async function callGroq(system: string, user: string): Promise<RecommendationResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`groq_error_${response.status}`);
  }

  const body: { choices?: { message?: { content?: string } }[] } = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) return null;

  return normalizeGroqResult(JSON.parse(content));
}

// Doradca AI (Sesja V4.2a + V4.2b) — Groq sam nie ma dostępu do internetu ani do danych o
// miejscach, więc pełni tu wyłącznie rolę warstwy syntezy nad kontekstem złożonym
// server-side z Google Places (New) + własnej bazy (historia karnetów); link do profilu
// Google Maps (V4.2b) jest dołączany osobno, bez przepuszczania przez model. Każdy błąd
// zewnętrznego API (brak klucza, timeout, 4xx/5xx, zły JSON) jest łapany tutaj i zwraca
// `null` — to zawsze sekcja dodatkowa, nigdy nie blokuje reszty aplikacji.
export async function getAiRecommendations(
  identity: CallerIdentity,
  input: RecommendationInput
): Promise<RecommendationResult | null> {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const [nearbyPlaces, historyCompanyNames] = await Promise.all([
      fetchNearbyPlaces(input),
      fetchHistoryCompanyNames(identity),
    ]);

    if (nearbyPlaces.length === 0 && historyCompanyNames.length === 0) return null;

    const { system, user } = buildPrompt(input, nearbyPlaces, historyCompanyNames);
    const result = await callGroq(system, user);
    if (!result) return null;

    return attachMapsLinks(result, nearbyPlaces);
  } catch {
    return null;
  }
}
