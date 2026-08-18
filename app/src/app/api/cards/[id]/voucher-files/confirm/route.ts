import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { VOUCHER_FILE_MAX_COUNT, isVoucherPathOwnedByCard } from "@/server/voucher-file";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/cards/:id/voucher-files/confirm — krok 2 uploadu (Sesja V4.3, ADR-009;
// przeniesione i rozszerzone w Sesji V6.2): wołane po udanym PUT na podpisany URL z
// .../sign-upload. Zamiast nadpisywać pojedyncze `voucherFileUrl` (dawne zachowanie),
// dodaje nowy wiersz `CardVoucherFile` — karnet może mieć ich kilka, do
// `VOUCHER_FILE_MAX_COUNT`. Limit sprawdzany ponownie tutaj (nie tylko w sign-upload), żeby
// zabezpieczyć się przed wyścigiem dwóch równoległych uploadów.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const path = (body as Record<string, unknown> | null)?.path;
  if (typeof path !== "string" || !isVoucherPathOwnedByCard(path, id)) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const existingCount = await prisma.cardVoucherFile.count({ where: { cardId: id } });
  if (existingCount >= VOUCHER_FILE_MAX_COUNT) {
    return NextResponse.json({ error: "limit_reached" }, { status: 400 });
  }

  const created = await prisma.cardVoucherFile.create({
    data: { cardId: id, storagePath: path },
  });

  return NextResponse.json({ file: { id: created.id } });
}
