import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCategoryInputErrors, parseCategoryInput } from "@/server/category-rules";
import { getVerifiedDeviceId } from "@/server/request-device";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  color: true,
  isSystem: true,
} as const;

// GET /api/categories — 5 kategorii systemowych (zawsze widoczne, wszystkim) + własne
// kategorie zweryfikowanego urządzenia (Sesja 16: w odróżnieniu od `companies`, kategoria
// użytkownika jest prywatna dla urządzenia, które ją dodało). Bez tokena widać tylko
// systemowe.
export async function GET(request: Request) {
  const deviceId = await getVerifiedDeviceId(request);

  const categories = await prisma.category.findMany({
    where: deviceId
      ? { OR: [{ isSystem: true }, { createdByDeviceId: deviceId }] }
      : { isSystem: true },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: categorySelect,
  });

  return NextResponse.json({ categories });
}

// POST /api/categories — dodanie własnej kategorii, zawsze prywatnej dla urządzenia,
// które ją utworzyło. Wymaga zweryfikowanego device tokena (ADR-007), analogicznie do
// POST /api/companies.
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

  const input = parseCategoryInput(body);
  const errors = getCategoryInputErrors(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: input.name!,
      color: input.color!,
      isSystem: false,
      createdByDeviceId: deviceId,
    },
    select: categorySelect,
  });

  return NextResponse.json({ category }, { status: 201 });
}
