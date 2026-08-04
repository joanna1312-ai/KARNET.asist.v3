import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCardArchived } from "@/server/card-status";
import { getVerifiedDeviceId } from "@/server/request-device";
import { getVisitInputErrors, parseVisitInput } from "@/server/visit-rules";

type RouteParams = { params: Promise<{ id: string }> };

// Skopowane po `deviceId` (ADR-007), tak jak trasy /api/cards — wejście można dodać
// tylko do karnetu należącego do wywołującego urządzenia.
async function findOwnedCard(id: string, deviceId: string) {
  return prisma.card.findFirst({ where: { id, deviceId, deletedAt: null } });
}

// POST /api/cards/:id/visits — dodaje wejście (docs/API.md). Zablokowane dla karnetu
// już zarchiwizowanego (limit wyczerpany / minęła data ważności — docs/DATABASE.md),
// żeby used_visits nie rosło ponad sens po archiwizacji.
export async function POST(request: Request, { params }: RouteParams) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const card = await findOwnedCard(id, deviceId);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (isCardArchived(card)) {
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
