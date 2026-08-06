import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth";
import { getVerifiedDeviceId } from "@/server/request-device";

export type CallerIdentity = {
  deviceId: string | null;
  userId: string | null;
};

// Karnety/wejścia (Sesja 14) są dostępne dla wywołującego, jeśli pasuje CHOCIAŻ JEDNO z:
// zweryfikowany token urządzenia (ADR-007) albo zalogowana sesja NextAuth. Oba źródła
// muszą być sprawdzane razem — po POST /api/auth/link-device karnet ma ustawione tylko
// userId (deviceId = null), a nowo dodany na tym samym urządzeniu karnet może jeszcze nie
// być połączony z kontem (link-device odpala się raz po zalogowaniu, nie przy każdym
// zapisie). Konto pozostaje opcjonalne — brak sesji nie blokuje dostępu, jeśli jest ważny
// token urządzenia.
export async function getCallerIdentity(request: Request): Promise<CallerIdentity> {
  const [deviceId, session] = await Promise.all([
    getVerifiedDeviceId(request),
    getServerSession(authOptions),
  ]);

  return { deviceId, userId: session?.user?.id ?? null };
}

export function hasIdentity(identity: CallerIdentity): boolean {
  return identity.deviceId !== null || identity.userId !== null;
}
