import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { removeVoucherObject } from "@/server/storage";
import {
  isStorageVoucherFileUrl,
  isVoucherPathOwnedByCard,
  toStorageVoucherFileUrl,
  voucherStoragePath,
} from "@/server/voucher-file";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/cards/:id/voucher-file/confirm — krok 2 uploadu (Sesja V4.3, ADR-009): wołane
// po udanym PUT na podpisany URL z .../sign-upload. Zapisuje ścieżkę w `voucherFileUrl`
// (z prefiksem `storage:`, patrz voucher-file.ts) i sprząta poprzedni plik, jeśli karnet
// już jakiś miał — ale TYLKO gdy poprzednia ścieżka należała do TEGO karnetu (nie do
// karnetu źródłowego przy "Odnów", który mógł dziedziczyć tę samą ścieżkę).
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

  const previous = card.voucherFileUrl;

  const updated = await prisma.card.update({
    where: { id },
    data: { voucherFileUrl: toStorageVoucherFileUrl(path) },
  });

  if (
    isStorageVoucherFileUrl(previous) &&
    voucherStoragePath(previous) !== path &&
    isVoucherPathOwnedByCard(voucherStoragePath(previous), id)
  ) {
    await removeVoucherObject(voucherStoragePath(previous)).catch(() => {});
  }

  return NextResponse.json({ card: { id: updated.id, voucherFileUrl: updated.voucherFileUrl } });
}
