"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// Konto i urządzenie to dwie rozłączne przestrzenie danych (patrz
// src/server/card-owner.ts) — bez tego paska użytkownik nie miałby jak się
// zorientować, że dane, które właśnie wprowadza, zostaną tylko na tym urządzeniu.
export function GuestNotice() {
  const t = useTranslations("account");
  const { status } = useSession();
  const pathname = usePathname();

  // Ekran onboardingu (1m) na "/" jest celowo pełnoekranowy, bez tego paska.
  if (pathname === "/") return null;
  if (status !== "unauthenticated") return null;

  return (
    <p className="border-b border-black/10 bg-black/5 px-4 py-2 text-center text-sm text-foreground/70 md:mx-auto md:w-full md:max-w-2xl dark:border-white/10 dark:bg-white/5">
      {t("guestNotice")}
    </p>
  );
}
