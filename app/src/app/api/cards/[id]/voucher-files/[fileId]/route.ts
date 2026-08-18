import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { removeVoucherObject } from "@/server/storage";

type RouteParams = { params: Promise<{ id: string; fileId: string }> };

// DELETE /api/cards/:id/voucher-files/:fileId — usuwa jeden plik vouchera (Sesja V6.2):
// obiekt z bucketa (best-effort, patrz removeVoucherObject) i wiersz z bazy. Autoryzacja
// jak reszta /api/cards/* — właściciel karnetu, nie samego pliku.
export async function DELETE(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;
  const card = await findOwnedCard(id, identity);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const file = await prisma.cardVoucherFile.findFirst({ where: { id: fileId, cardId: id } });
  if (!file) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.cardVoucherFile.delete({ where: { id: fileId } });
  await removeVoucherObject(file.storagePath).catch(() => {});

  return NextResponse.json({ ok: true });
}
