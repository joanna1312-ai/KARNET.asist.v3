import { NextResponse } from "next/server";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { createVoucherReadUrl } from "@/server/storage";
import { isStorageVoucherFileUrl, voucherStoragePath } from "@/server/voucher-file";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/cards/:id/voucher-file — świeży podpisany URL do wyświetlenia pliku (bucket
// jest prywatny, patrz ADR-009). Wołane z cards/[id]/page.tsx zamiast osadzania trwałego
// linku w odpowiedzi GET /api/cards/:id.
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

  if (!isStorageVoucherFileUrl(card.voucherFileUrl)) {
    return NextResponse.json({ error: "not_a_file" }, { status: 404 });
  }

  try {
    const url = await createVoucherReadUrl(voucherStoragePath(card.voucherFileUrl));
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "sign_read_failed" }, { status: 502 });
  }
}
