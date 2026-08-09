import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { ownerFilter } from "@/server/card-owner";

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

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/companies/:id — dane firmy + karnety wywołującego w tej firmie (filtr po
// companyId, docs/API.md — nie po nazwie jak w prototypie). Identity jak w /api/cards
// (ADR-007/Sesja 14): zalogowany widzi karnety konta (userId), niezalogowany — karnety
// bieżącego urządzenia (deviceId), przez ownerFilter (te przestrzenie się nie mieszają).
// Wymaga którejś z tych tożsamości, bo sens tego endpointu to pokazanie *własnych*
// karnetów.
export async function GET(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    select: companySelect,
  });

  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const cards = await prisma.card.findMany({
    where: { companyId: id, deletedAt: null, ...ownerFilter(identity) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ company, cards });
}
