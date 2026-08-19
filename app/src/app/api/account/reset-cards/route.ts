import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { ownerFilter } from "@/server/card-owner";
import { removeVoucherObject } from "@/server/storage";

// POST /api/account/reset-cards — Sesja V6.10: "wyczyszczenie danych karnetów" z
// ustawień. Miękko usuwa (deletedAt) WSZYSTKIE karnety bieżącej tożsamości (aktywne i
// archiwalne — ta sama definicja własności co reszta /api/cards/*, patrz card-owner.ts),
// łącznie ze sprzątnięciem plików voucherów (CardVoucherFile + obiekty w Storage), bo
// przy miękkim usunięciu FK CASCADE na card_voucher_files się nie uruchamia (to nie jest
// realny DELETE wiersza Card). Świadomie NIE dotyka Company/Category/Favorite (mogą być
// współdzielone z innymi urządzeniami/kontem) ani wierszy Visit (zostają w bazie, ale są
// nieosiągalne przez API, bo każdy odczyt karnetu filtruje po deletedAt: null nadrzędnej
// karty).
export async function POST(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cards = await prisma.card.findMany({
    where: { deletedAt: null, ...ownerFilter(identity) },
    select: { id: true, voucherFiles: { select: { storagePath: true } } },
  });

  if (cards.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  const cardIds = cards.map((card) => card.id);
  const storagePaths = cards.flatMap((card) =>
    card.voucherFiles.map((file) => file.storagePath)
  );

  await prisma.$transaction([
    prisma.cardVoucherFile.deleteMany({ where: { cardId: { in: cardIds } } }),
    prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { deletedAt: new Date() },
    }),
  ]);

  await Promise.all(
    storagePaths.map((path) => removeVoucherObject(path).catch(() => {}))
  );

  return NextResponse.json({ ok: true, count: cardIds.length });
}
