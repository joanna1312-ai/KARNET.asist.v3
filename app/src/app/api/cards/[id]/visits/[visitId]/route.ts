import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity, type CallerIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import {
  getVisitInputErrors,
  parseVisitPatch,
  VisitInputCandidate,
} from "@/server/visit-rules";

type RouteParams = { params: Promise<{ id: string; visitId: string }> };

// Skopowane po tożsamości wywołującego (ADR-007 + Sesja 14, patrz
// caller-identity.ts/card-owner.ts) i przynależności wpisu do karnetu — wejście innego
// urządzenia/konta lub innego karnetu nigdy nie jest widoczne ani edytowalne.
async function findOwnedVisit(cardId: string, visitId: string, identity: CallerIdentity) {
  const card = await findOwnedCard(cardId, identity);
  if (!card) return null;

  const visit = await prisma.visit.findFirst({ where: { id: visitId, cardId: card.id } });
  if (!visit) return null;

  return { card, visit };
}

// PATCH /api/cards/:id/visits/:visitId — edycja daty/godziny/notatki (docs/API.md).
// Nie zmienia usedVisits — to tylko korekta danych istniejącego wpisu.
export async function PATCH(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, visitId } = await params;
  const found = await findOwnedVisit(id, visitId, identity);
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
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, visitId } = await params;
  const found = await findOwnedVisit(id, visitId, identity);
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
