import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedDeviceId } from "@/server/request-device";

const companySelect = { id: true, name: true, category: true } as const;

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/companies/:id — dane firmy + karnety zweryfikowanego urządzenia w tej
// firmie (filtr po companyId, docs/API.md — nie po nazwie jak w prototypie).
// Wymaga device tokena, bo sens tego endpointu to pokazanie *własnych* karnetów.
export async function GET(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
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
    where: { companyId: id, deviceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ company, cards });
}
