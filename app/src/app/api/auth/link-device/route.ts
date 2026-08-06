import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/server/auth";
import { getVerifiedDeviceId } from "@/server/request-device";

// POST /api/auth/link-device (docs/API.md) — synchronizacja karnetów bez konta z kontem
// po zalogowaniu. Wymaga OBU rzeczy naraz: zalogowanej sesji (kto dostaje karnety) i
// zweryfikowanego tokena urządzenia (ADR-007 — czyje karnety, nigdy z surowego deviceId).
// Przypina tylko karnety TEGO urządzenia (`deviceId = null`, `userId = ...`) — inne
// urządzenia nietknięte. Konto pozostaje opcjonalne (CLAUDE.md) — ten endpoint tylko
// synchronizuje, żadna funkcja rdzeniowa go nie wymaga.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { count } = await prisma.card.updateMany({
    where: { deviceId },
    data: { deviceId: null, userId: session.user.id },
  });

  return NextResponse.json({ linkedCount: count });
}
