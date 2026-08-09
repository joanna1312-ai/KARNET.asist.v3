"use client";

import { useTranslations } from "next-intl";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

// Konto i urządzenie to dwie rozłączne przestrzenie danych, które nigdy się nie mieszają
// (patrz src/server/card-owner.ts) — zalogowanie NIE przenosi danych zapisanych wcześniej
// bez konta, więc to jedyne miejsce w UI, które w ogóle wspomina o logowaniu, musi też
// jasno mówić, w którym trybie jesteś (patrz GuestNotice.tsx dla stanu niezalogowanego).
// Konto zawsze opcjonalne (CLAUDE.md).
export function AccountMenu() {
  const t = useTranslations("account");
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <Button type="button" variant="neutral" onClick={() => signIn("google")} className="truncate">
        {t("signInButton")}
      </Button>
    );
  }

  const name = session.user?.name ?? session.user?.email ?? "";

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className="hidden max-w-[10rem] truncate text-sm text-foreground/70 sm:inline"
        title={t("signedInAs", { name })}
      >
        {t("signedInAs", { name })}
      </span>
      <Button type="button" variant="neutral" onClick={() => signOut()} className="truncate">
        {t("signOutButton")}
      </Button>
    </div>
  );
}
