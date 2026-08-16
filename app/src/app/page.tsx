"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { deviceFetch } from "@/lib/device-client";

// Ekran startowy (1m): onboarding pokazuje się tylko gościom bez konta i bez żadnego
// karnetu na tym urządzeniu — w każdym innym przypadku wraca dotychczasowe zachowanie
// (przekierowanie na /cards). Tożsamość urządzenia-gościa żyje tylko w localStorage
// (patrz device-client.ts, ADR-007), więc tej decyzji nie da się podjąć na serwerze.
export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      router.replace("/cards");
      return;
    }

    let ignore = false;

    deviceFetch("/api/cards")
      .then(async (response) => {
        if (ignore) return;
        if (!response.ok) {
          router.replace("/cards");
          return;
        }
        const body: { cards: unknown[] } = await response.json();
        if (body.cards.length === 0) {
          setShowOnboarding(true);
        } else {
          router.replace("/cards");
        }
      })
      .catch(() => {
        if (!ignore) router.replace("/cards");
      });

    return () => {
      ignore = true;
    };
  }, [status, router]);

  if (!showOnboarding) return null;

  return <OnboardingScreen />;
}
