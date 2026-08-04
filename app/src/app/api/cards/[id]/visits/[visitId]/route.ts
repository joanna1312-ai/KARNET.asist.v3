import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedDeviceId } from "@/server/request-device";
import {
  getVisitInputErrors,
  parseVisitPatch,
  VisitInputCandidate,
} from "@/server/visit-rules";

type RouteParams = { params: Promise<{ id: string; visitId: string }> };

// Skopowane po `deviceId` (ADR-007) i przynależności wpisu do karnetu — wejście innego
// urządzenia lub innego karnetu nigdy nie jest widoczne ani edytowalne.
async function findOwnedVisit(cardId: string, visitId: string, deviceId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, deviceId, deletedAt: null },
  });
  if (!card) return null;

  const visit = await prisma.visit.findFirst({ where: { id: visitId, cardId: card.id } });
  if (!visit) return null;

  return { card, visit };
}

// PATCH /api/cards/:id/visits/:visitId — edycja daty/godziny/notatki (docs/API.md).
// Nie zmienia usedVisits — to tylko korekta danych istniejącego wpisu.
export async function PATCH(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, visitId } = await params;
  const found = await findOwnedVisit(id, visitId, deviceId);
  if (!found) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch = parseVisitPatch(body);
  const merged: VisitInputCandidate = {
    visitDate: patch.visitDate !== undefined ? patch.visitDate : found.visit.visitDate,
    visitTime: patch.visitTime !== undefined ? patch.visitTime : found.visit.visitTime,
    note: patch.note !== undefined ? patch.note : found.visit.note,
  };

  const errors = getVisitInputErrors(merged);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const visit = await prisma.visit.update({
    where: { id: visitId },
    data: {
      visitDate: merged.visitDate!,
      visitTime: merged.visitTime,
      note: merged.note,
    },
  });

  return NextResponse.json({ visit });
}

// DELETE /api/cards/:id/visits/:visitId — usunięcie błędnie dodanego wejścia
// (docs/API.md), wywoływane dopiero po potwierdzeniu w UI. Dekrementuje usedVisits,
// nie schodząc poniżej zera.
export async function DELETE(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, visitId } = await params;
  const found = await findOwnedVisit(id, visitId, deviceId);
  if (!found) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.visit.delete({ where: { id: visitId } }),
    prisma.card.update({
      where: { id: found.card.id },
      data: { usedVisits: Math.max(0, found.card.usedVisits - 1) },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
