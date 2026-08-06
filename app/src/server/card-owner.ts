import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CallerIdentity } from "@/server/caller-identity";

// Filtr własności karnetu — dwie ROZŁĄCZNE przestrzenie danych, bez mieszania.
// Zalogowany widzi wyłącznie karnety konta (userId), niezależnie od tego, co jest na
// urządzeniu; niezalogowany widzi wyłącznie karnety urządzenia (deviceId). Sesja (userId)
// ma pierwszeństwo, jeśli jest obecna — token urządzenia jest wtedy ignorowany przy
// odczycie (patrz też card creation w cards/route.ts, które z tego samego powodu zapisuje
// nowy karnet pod userId, a nie deviceId, gdy wywołujący jest zalogowany). Jedyny most
// między przestrzeniami to jednorazowa migracja w POST /api/auth/link-device.
export function ownerFilter(identity: CallerIdentity): Prisma.CardWhereInput {
  if (identity.userId) return { userId: identity.userId };
  return { deviceId: identity.deviceId };
}

export async function findOwnedCard(id: string, identity: CallerIdentity) {
  return prisma.card.findFirst({
    where: { id, deletedAt: null, ...ownerFilter(identity) },
  });
}
