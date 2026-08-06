import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCardInputErrors, parseCardInput } from "@/server/card-rules";
import { isCardArchived } from "@/server/card-status";
import { getVerifiedDeviceId } from "@/server/request-device";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  color: true,
  isSystem: true,
} as const;
const companySelect = { id: true, name: true, category: { select: categorySelect } } as const;

// Adnotacja jawna, bo TS gubi się przy inferencji typu elementu tablicy w
// `.filter(...)` na wyniku `findMany` z zagnieżdżonym `include`/`select` (Prisma).
type CardWithCompany = Prisma.CardGetPayload<{
  include: { company: { select: typeof companySelect } };
}>;

// GET /api/cards[?archived=true] — lista karnetów bieżącego urządzenia (ADR-007).
// `archived` liczone w locie wg formuły z docs/DATABASE.md, nie jest kolumną.
export async function GET(request: Request) {
  const deviceId = await getVerifiedDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const wantArchived = new URL(request.url).searchParams.get("archived") === "true";

  const cards: CardWithCompany[] = await prisma.card.findMany({
    where: { deviceId, deletedAt: null },
    include: { company: { select: companySelect } },
    orderBy: { createdAt: "desc" },
  });

  const filtered = cards.filter((card) => isCardArchived(card) === wantArchived);

  return NextResponse.json({ cards: filtered });
}

// POST /api/cards — kreator karnetu (krok 1-3 z prototypu). Reguła
// `unlimited ⇒ expiryDate wymagane` wymuszona tu, nie tylko w UI (docs/API.md).
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

  const input = parseCardInput(body);
  const errors = getCardInputErrors(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: input.companyId! },
  });
  if (!company) {
    return NextResponse.json({ errors: ["companyRequired"] }, { status: 400 });
  }

  const card = await prisma.card.create({
    data: {
      deviceId,
      companyId: input.companyId!,
      type: input.type!,
      totalVisits: input.totalVisits ?? null,
      expiryDate: input.expiryDate ?? null,
      voucherMode: input.voucherMode!,
      voucherFileUrl: input.voucherFileUrl ?? null,
    },
    include: { company: { select: companySelect } },
  });

  return NextResponse.json({ card }, { status: 201 });
}
