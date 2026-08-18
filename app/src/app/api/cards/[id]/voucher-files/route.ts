import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { createVoucherReadUrl } from "@/server/storage";
import { voucherFileKindFromPath } from "@/server/voucher-file";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/cards/:id/voucher-files — świeże podpisane URL-e wszystkich plików vouchera
// karnetu (Sesja V6.2, zastępuje pojedynczy plik z Sesji V4.3/ADR-009). Bucket jest
// prywatny, więc odczyt zawsze idzie przez ten endpoint, nigdy przez trwały link
// osadzony w odpowiedzi GET /api/cards/:id.
export async function GET(request: Request, { params }: RouteParams) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const card = await findOwnedCard(id, identity);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const rows = await prisma.cardVoucherFile.findMany({
    where: { cardId: id },
    orderBy: { createdAt: "asc" },
  });

  const files = await Promise.all(
    rows.map(async (row) => {
      try {
        const url = await createVoucherReadUrl(row.storagePath);
        return { id: row.id, url, kind: voucherFileKindFromPath(row.storagePath) };
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({ files: files.filter((f) => f !== null) });
}
