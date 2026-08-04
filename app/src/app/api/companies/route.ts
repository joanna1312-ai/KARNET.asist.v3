import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyInputErrors, parseCompanyInput } from "@/server/company-rules";
import { getVerifiedDeviceId } from "@/server/request-device";

// Firmy nie są danymi osobowymi użytkownika — lista jest publiczna do odczytu
// (docs/DATABASE.md, sekcja RLS). Potrzebna, żeby kreator karnetu miał z czego wybierać.
export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json({ companies });
}

// POST /api/companies — ręczne dodanie nowej firmy (Sesja 8, docs/API.md). Bez
// integracji Google Places (ADR-004) — tylko nazwa i kategoria, lat/lng/google_place_id
// zostają null do czasu realnej integracji. Wymaga zweryfikowanego device tokena
// (ADR-007), żeby zapis do współdzielonej tabeli firm nie był w pełni anonimowy;
// samo dodanie firmy nie wymaga konta.
export async function POST(request: Request) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = parseCompanyInput(body);
  const errors = getCompanyInputErrors(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: { name: input.name!, category: input.category! },
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json({ company }, { status: 201 });
}
