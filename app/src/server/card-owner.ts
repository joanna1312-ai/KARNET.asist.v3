import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CallerIdentity } from "@/server/caller-identity";

// Filtr własności karnetu — dopasowuje po deviceId LUB userId, cokolwiek z nich jest
// dostępne (patrz caller-identity.ts). Wywołujący z obiema tożsamościami (zalogowany, z
// tokenem urządzenia) widzi zarówno karnety już połączone z kontem, jak i te jeszcze nie
// zsynchronizowane z tego urządzenia.
export function ownerFilter(identity: CallerIdentity): Prisma.CardWhereInput {
  if (identity.deviceId && identity.userId) {
    return { OR: [{ deviceId: identity.deviceId }, { userId: identity.userId }] };
  }
  if (identity.userId) return { userId: identity.userId };
  return { deviceId: identity.deviceId };
}

export async function findOwnedCard(id: string, identity: CallerIdentity) {
  return prisma.card.findFirst({
    where: { id, deletedAt: null, ...ownerFilter(identity) },
  });
}
