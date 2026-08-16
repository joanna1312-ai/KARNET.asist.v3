import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  locale?: string;
}

// POST /api/push/subscribe — zapisuje/aktualizuje subskrypcję Web Push wywołującego
// (konto albo urządzenie, ten sam rozdział własności co card-owner.ts). `endpoint` jest
// unikalny sam w sobie — upsert po nim, żeby ponowna rejestracja tej samej przeglądarki
// nadpisywała wiersz zamiast duplikować (np. po odświeżeniu klucza subskrypcji).
export async function POST(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      locale: body.locale ?? "pl",
      userId: identity.userId,
      deviceId: identity.userId ? null : identity.deviceId,
    },
    update: {
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      locale: body.locale ?? "pl",
      userId: identity.userId,
      deviceId: identity.userId ? null : identity.deviceId,
    },
  });

  return new NextResponse(null, { status: 204 });
}

// DELETE /api/push/subscribe — wypisuje z przypomnień (przełącznik w /account).
// Idempotentne — usunięcie nieistniejącej subskrypcji nie jest błędem.
export async function DELETE(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });

  return new NextResponse(null, { status: 204 });
}
