import { NextResponse } from "next/server";
import { getAiRecommendations } from "@/server/ai-recommendations";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";

interface RequestBody {
  lat?: unknown;
  lng?: unknown;
  categoryId?: unknown;
  categoryName?: unknown;
  locale?: unknown;
}

// POST /api/ai/recommendations — doradca AI (Sesja V4.2a): rekomendacje miejsc w
// okolicy (Google Places (New) + Groq) i sugestie na bazie dotychczasowych karnetów
// wywołującego (konto albo urządzenie, jak /api/cards). Zawsze 200 z
// `recommendations: null`, gdy AI nie ma czym się posłużyć albo zewnętrzne API zawiodło
// — to sekcja dodatkowa, nie krytyczna ścieżka aplikacji.
export async function POST(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  if (lat === null || lng === null) {
    return NextResponse.json({ error: "locationRequired" }, { status: 400 });
  }

  const locale = body.locale === "en" ? "en" : "pl";
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : undefined;
  const categoryName = typeof body.categoryName === "string" ? body.categoryName : undefined;

  const recommendations = await getAiRecommendations(identity, {
    lat,
    lng,
    categoryId,
    categoryName,
    locale,
  });

  return NextResponse.json({ recommendations });
}
