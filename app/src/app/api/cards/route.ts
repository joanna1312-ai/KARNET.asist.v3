import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { getCardInputErrors, parseCardInput } from "@/server/card-rules";
import { isCardArchived, startOfToday } from "@/server/card-status";
import { ownerFilter } from "@/server/card-owner";

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
  include: {
    company: { select: typeof companySelect };
    _count: { select: { visits: true } };
  };
}>;

// GET /api/cards[?archived=true] — lista karnetów. Zalogowany widzi wyłącznie karnety
// konta, niezalogowany wyłącznie karnety bieżącego urządzenia — dwie rozłączne
// przestrzenie, bez mieszania (ADR-007, Sesja 14 — patrz caller-identity.ts/card-owner.ts).
// `archived` liczone w locie wg formuły z docs/DATABASE.md, nie jest kolumną.
export async function GET(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const wantArchived = new URL(request.url).searchParams.get("archived") === "true";
  const today = startOfToday();

  const cards: CardWithCompany[] = await prisma.card.findMany({
    where: { deletedAt: null, ...ownerFilter(identity) },
    include: {
      company: { select: companySelect },
      // Sesja V6.3: wejścia zrealizowane (data <= dziś) decydują o archiwizacji, nie
      // surowy usedVisits (który rośnie natychmiast, także dla wejść z przyszłą datą).
      _count: { select: { visits: { where: { visitDate: { lte: today } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withRealizedVisits = cards.map(({ _count, ...card }) => ({
    ...card,
    realizedVisits: _count.visits,
  }));

  const filtered = withRealizedVisits.filter(
    (card) => isCardArchived(card) === wantArchived
  );

  return NextResponse.json({ cards: filtered });
}

// POST /api/cards — kreator karnetu (krok 1-3 z prototypu). Reguła
// `unlimited ⇒ expiryDate wymagane` wymuszona tu, nie tylko w UI (docs/API.md). Nowy
// karnet trafia do tej samej przestrzeni, z której wywołujący czyta (ownerFilter) —
// zalogowany zapisuje pod userId, nie deviceId, żeby dane dodane w trakcie bycia
// zalogowanym nie zostały "na urządzeniu" i nie były widoczne po wylogowaniu.
export async function POST(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
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
      deviceId: identity.userId ? null : identity.deviceId,
      userId: identity.userId,
      companyId: input.companyId!,
      type: input.type!,
      totalVisits: input.totalVisits ?? null,
      expiryDate: input.expiryDate ?? null,
      voucherFileUrl: input.voucherFileUrl ?? null,
    },
    include: { company: { select: companySelect } },
  });

  return NextResponse.json({ card }, { status: 201 });
}
