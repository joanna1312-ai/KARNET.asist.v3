"use client";

import { useTranslations } from "next-intl";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { deviceFetch } from "@/lib/device-client";

type LinkState = "idle" | "linking" | "linked" | "error";

// Sesja 14: po zalogowaniu przypina karnety BIEŻĄCEGO urządzenia (ADR-007 — token
// urządzenia, nigdy surowy deviceId) do zalogowanego konta przez
// POST /api/auth/link-device. Konto zawsze opcjonalne (CLAUDE.md) — to jedyne
// miejsce w UI, które w ogóle wspomina o logowaniu.
export function AccountMenu() {
  const t = useTranslations("account");
  const { data: session, status } = useSession();
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const linkedForStatus = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || linkedForStatus.current === "authenticated") return;
    linkedForStatus.current = "authenticated";

    setLinkState("linking");
    deviceFetch("/api/auth/link-device", { method: "POST" })
      .then((response) => setLinkState(response.ok ? "linked" : "error"))
      .catch(() => setLinkState("error"));
  }, [status]);

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="truncate rounded-full bg-black/5 px-3 py-1.5 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        {t("signInButton")}
      </button>
    );
  }

  const name = session.user?.name ?? session.user?.email ?? "";

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className="hidden max-w-[10rem] truncate text-sm text-foreground/70 sm:inline"
        title={
          linkState === "linking"
            ? t("linkingDevice")
            : linkState === "error"
              ? t("linkDeviceError")
              : t("signedInAs", { name })
        }
      >
        {t("signedInAs", { name })}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="truncate rounded-full bg-black/5 px-3 py-1.5 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        {t("signOutButton")}
      </button>
    </div>
  );
}
