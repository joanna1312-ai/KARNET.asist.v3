import { NextResponse } from "next/server";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { findOwnedCard } from "@/server/card-owner";
import { createVoucherUploadUrl } from "@/server/storage";
import { isAllowedVoucherContentType, voucherObjectPath } from "@/server/voucher-file";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/cards/:id/voucher-file/sign-upload — krok 1 uploadu (Sesja V4.3, ADR-009).
// Zwraca podpisany URL do zapisu bezpośrednio w Supabase Storage z pominięciem naszej
// funkcji serverless (limit ciała requestu na Vercel ~4.5 MB nie wystarczyłby na plik do
// 10 MB) — przeglądarka wysyła plik prosto do Supabase, my tylko autoryzujemy i wskazujemy
// docelową ścieżkę. Typ pliku deklarowany przez klienta jest tu tylko wstępnie
// zawężany do dozwolonej listy; ostateczne egzekwowanie typu/rozmiaru robi konfiguracja
// bucketa w Supabase.
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

  const contentType = (body as Record<string, unknown> | null)?.contentType;
  if (!isAllowedVoucherContentType(contentType)) {
    return NextResponse.json({ error: "unsupported_content_type" }, { status: 400 });
  }

  const path = voucherObjectPath(id, contentType);

  try {
    const uploadUrl = await createVoucherUploadUrl(path);
    return NextResponse.json({ uploadUrl, path });
  } catch {
    return NextResponse.json({ error: "sign_upload_failed" }, { status: 502 });
  }
}
