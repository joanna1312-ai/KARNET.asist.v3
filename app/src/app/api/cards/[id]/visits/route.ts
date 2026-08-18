import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { isCardArchived, startOfToday } from "@/server/card-status";
import { getVisitInputErrors, parseVisitInput } from "@/server/visit-rules";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/cards/:id/visits — dodaje wejście (docs/API.md). Skopowane po tożsamości
// wywołującego (ADR-007 + Sesja 14, patrz caller-identity.ts/card-owner.ts) — wejście
// można dodać tylko do karnetu należącego do wywołującego urządzenia/konta. Zablokowane
// dla karnetu już zarchiwizowanego (limit wyczerpany / minęła data ważności —
// docs/DATABASE.md), żeby used_visits nie rosło ponad sens po archiwizacji.
export async function POST(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const card = await findOwnedCard(id, identity);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Sesja V6.3: realizedVisits (wejścia z datą <= dziś), nie surowy usedVisits — karnet z
  // limitem osiągniętym wyłącznie przyszłymi wejściami nie jest jeszcze zarchiwizowany.
  const realizedVisits = await prisma.visit.count({
    where: { cardId: card.id, visitDate: { lte: startOfToday() } },
  });

  if (isCardArchived({ ...card, realizedVisits })) {
    return NextResponse.json({ error: "card_archived" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = parseVisitInput(body);
  const errors = getVisitInputErrors(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Wpis wejścia i inkrementacja licznika muszą powstać razem — stąd transakcja.
  const [visit] = await prisma.$transaction([
    prisma.visit.create({
      data: {
        cardId: card.id,
        visitDate: input.visitDate!,
        visitTime: input.visitTime,
        note: input.note,
      },
    }),
    prisma.card.update({
      where: { id: card.id },
      data: { usedVisits: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ visit }, { status: 201 });
}
