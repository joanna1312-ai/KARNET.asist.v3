import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedDeviceId } from "@/server/request-device";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/companies/favorites/:id — oznacza firmę jako ulubioną dla zweryfikowanego
// urządzenia (ADR-007, ten sam mechanizm co reszta API bez konta). Idempotentne —
// ponowne dodanie już ulubionej firmy nie jest błędem.
export async function POST(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: companyId } = await params;
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: { deviceId_companyId: { deviceId, companyId } },
    create: { deviceId, companyId },
    update: {},
  });

  return new NextResponse(null, { status: 204 });
}

// DELETE /api/companies/favorites/:id — usuwa firmę z ulubionych. Idempotentne —
// usunięcie firmy, która nie była ulubiona, nie jest błędem.
export async function DELETE(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: companyId } = await params;
  await prisma.favorite.deleteMany({ where: { deviceId, companyId } });

  return new NextResponse(null, { status: 204 });
}
