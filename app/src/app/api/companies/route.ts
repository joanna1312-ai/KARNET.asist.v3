import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyInputErrors, parseCompanyInput } from "@/server/company-rules";
import { getVerifiedDeviceId } from "@/server/request-device";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  color: true,
  isSystem: true,
} as const;
const companySelect = {
  id: true,
  name: true,
  lat: true,
  lng: true,
  category: { select: categorySelect },
} as const;

// Firmy nie są danymi osobowymi użytkownika — lista jest publiczna do odczytu
// (docs/DATABASE.md, sekcja RLS). Potrzebna, żeby kreator karnetu miał z czego wybierać.
// Device token opcjonalny (jak dotąd): jeśli obecny, dokłada `isFavorite` per firma
// (Sesja 12) — ulubione są prywatne per urządzenie, więc bez tokena zawsze `false`.
// `?favorites=true` filtruje do samych ulubionych i wymaga tokena.
export async function GET(request: Request) {
  const deviceId = await getVerifiedDeviceId(request);
  const url = new URL(request.url);
  const favoritesOnly = url.searchParams.get("favorites") === "true";

  if (favoritesOnly && !deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const favoriteCompanyIds = deviceId
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: { deviceId },
            select: { companyId: true },
          })
        ).map((favorite) => favorite.companyId)
      )
    : new Set<string>();

  const companies = await prisma.company.findMany({
    where: favoritesOnly ? { id: { in: [...favoriteCompanyIds] } } : undefined,
    orderBy: { name: "asc" },
    select: companySelect,
  });

  const result = companies.map((company) => ({
    ...company,
    isFavorite: favoriteCompanyIds.has(company.id),
  }));

  return NextResponse.json({ companies: result });
}

// POST /api/companies — dodanie nowej firmy (Sesja 8, docs/API.md), opcjonalnie z
// lokalizacją z Google Places (Sesja V4.1, ADR-004) — lat/lng/googlePlaceId zostają
// null, gdy firma jest dodawana ręcznie bez wyboru podpowiedzi. Wymaga zweryfikowanego
// device tokena (ADR-007), żeby zapis do współdzielonej tabeli firm nie był w pełni
// anonimowy; samo dodanie firmy nie wymaga konta.
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

  // categoryId musi wskazywać kategorię, którą to urządzenie faktycznie widzi:
  // systemową (widoczna dla wszystkich) albo własną prywatną kategorię tego urządzenia
  // (Sesja 16) — nie cudzą prywatną kategorię innego urządzenia.
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId! },
    select: { id: true, isSystem: true, createdByDeviceId: true },
  });
  if (!category || (!category.isSystem && category.createdByDeviceId !== deviceId)) {
    return NextResponse.json({ errors: ["categoryRequired"] }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: {
      name: input.name!,
      categoryId: input.categoryId!,
      lat: input.lat,
      lng: input.lng,
      googlePlaceId: input.googlePlaceId,
    },
    select: companySelect,
  });

  return NextResponse.json({ company }, { status: 201 });
}
