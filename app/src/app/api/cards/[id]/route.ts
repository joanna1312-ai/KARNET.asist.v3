import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  CardInputCandidate,
  getCardInputErrors,
  parseCardPatch,
} from "@/server/card-rules";
import { getVerifiedDeviceId } from "@/server/request-device";

const companySelect = { id: true, name: true, category: true } as const;

type RouteParams = { params: Promise<{ id: string }> };

// Wszystkie trzy handlery skopowane po `deviceId` (ADR-007) — karnet innego
// urządzenia nigdy nie jest widoczny ani edytowalny, niezależnie od podanego `id`.
async function findOwnedCard(id: string, deviceId: string) {
  return prisma.card.findFirst({ where: { id, deviceId, deletedAt: null } });
}

export async function GET(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const card = await prisma.card.findFirst({
    where: { id, deviceId, deletedAt: null },
    include: {
      company: { select: companySelect },
      visits: { orderBy: { visitDate: "desc" } },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}

// PATCH /api/cards/:id — edycja (m.in. expiryDate, w tym ustawienie na null).
// Reguła unlimited/limit wymuszona na scalonym stanie (istniejące pola + patch).
export async function PATCH(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedCard(id, deviceId);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch = parseCardPatch(body);
  const merged: CardInputCandidate = {
    companyId: patch.companyId !== undefined ? patch.companyId : existing.companyId,
    type: patch.type !== undefined ? patch.type : existing.type,
    totalVisits:
      patch.totalVisits !== undefined ? patch.totalVisits : existing.totalVisits,
    expiryDate: patch.expiryDate !== undefined ? patch.expiryDate : existing.expiryDate,
    voucherMode:
      patch.voucherMode !== undefined ? patch.voucherMode : existing.voucherMode,
    voucherFileUrl:
      patch.voucherFileUrl !== undefined
        ? patch.voucherFileUrl
        : existing.voucherFileUrl,
  };

  const errors = getCardInputErrors(merged);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  if (merged.companyId !== existing.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: merged.companyId! },
    });
    if (!company) {
      return NextResponse.json({ errors: ["companyRequired"] }, { status: 400 });
    }
  }

  const card = await prisma.card.update({
    where: { id },
    data: {
      companyId: merged.companyId!,
      type: merged.type!,
      totalVisits: merged.totalVisits ?? null,
      expiryDate: merged.expiryDate ?? null,
      voucherMode: merged.voucherMode!,
      voucherFileUrl: merged.voucherFileUrl ?? null,
    },
    include: { company: { select: companySelect } },
  });

  return NextResponse.json({ card });
}

// DELETE /api/cards/:id — miękkie usunięcie (deletedAt), wywoływane dopiero po
// potwierdzeniu w UI (dialog, nigdy jednym kliknięciem — patrz CLAUDE.md).
export async function DELETE(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedCard(id, deviceId);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.card.update({ where: { id }, data: { deletedAt: new Date() } });

  return new NextResponse(null, { status: 204 });
}
