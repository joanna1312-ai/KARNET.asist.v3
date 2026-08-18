import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import {
  CardInputCandidate,
  getCardInputErrors,
  parseCardPatch,
} from "@/server/card-rules";
import { findOwnedCard, ownerFilter } from "@/server/card-owner";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  color: true,
  isSystem: true,
} as const;
const companySelect = { id: true, name: true, category: { select: categorySelect } } as const;

type RouteParams = { params: Promise<{ id: string }> };

// Wszystkie trzy handlery skopowane po tożsamości wywołującego (ADR-007 + Sesja 14,
// patrz caller-identity.ts/card-owner.ts) — karnet innego urządzenia/konta nigdy nie jest
// widoczny ani edytowalny, niezależnie od podanego `id`.
export async function GET(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const card = await prisma.card.findFirst({
    where: { id, deletedAt: null, ...ownerFilter(identity) },
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
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedCard(id, identity);
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

  const nextVoucherFileUrl = merged.voucherFileUrl ?? null;

  // `voucherFileUrl` jest odtąd wyłącznie treścią/linkiem (Sesja 11) — pliki w object
  // storage żyją w osobnej tabeli `CardVoucherFile` (Sesja V6.2) i są sprzątane przez
  // DELETE /api/cards/:id/voucher-files/:fileId, nie przez ten endpoint.
  const card = await prisma.card.update({
    where: { id },
    data: {
      companyId: merged.companyId!,
      type: merged.type!,
      totalVisits: merged.totalVisits ?? null,
      expiryDate: merged.expiryDate ?? null,
      voucherMode: merged.voucherMode!,
      voucherFileUrl: nextVoucherFileUrl,
    },
    include: { company: { select: companySelect } },
  });

  return NextResponse.json({ card });
}

// DELETE /api/cards/:id — miękkie usunięcie (deletedAt), wywoływane dopiero po
// potwierdzeniu w UI (dialog, nigdy jednym kliknięciem — patrz CLAUDE.md).
export async function DELETE(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedCard(id, identity);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.card.update({ where: { id }, data: { deletedAt: new Date() } });

  return new NextResponse(null, { status: 204 });
}
