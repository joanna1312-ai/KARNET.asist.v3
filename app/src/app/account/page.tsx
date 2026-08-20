"use client";

import { BarChart3, Bell, ChevronRight, CircleHelp, Languages, LogIn, Smartphone, Sun, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AppearanceControl } from "@/components/AppearanceControl";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HelpDialog } from "@/components/HelpDialog";
import { LocaleToggle } from "@/components/LocaleToggle";
import { Logo } from "@/components/Logo";
import { Button, buttonClassName } from "@/components/ui/Button";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { APP_VERSION } from "@/lib/app-version";
import { deviceFetch } from "@/lib/device-client";
import {
  getExistingPushSubscription,
  getPushSupport,
  isIosStandaloneRequired,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

const CONTACT_EMAIL = "ai.joanna.dropia@gmail.com";

export default function AccountPage() {
  const t = useTranslations("accountPage");
  const tFooter = useTranslations("footer");
  const { data: session, status } = useSession();
  const locale = useLocale();
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [remindersPending, setRemindersPending] = useState(false);
  const [iosHintNeeded, setIosHintNeeded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetChecked, setResetChecked] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const isAuthenticated = status === "authenticated";
  const name = session?.user?.name ?? session?.user?.email ?? "";

  useEffect(() => {
    setIosHintNeeded(isIosStandaloneRequired());
    getExistingPushSubscription().then((subscription) => {
      setRemindersEnabled(subscription !== null);
    });
  }, []);

  async function handleRemindersToggle(next: boolean) {
    if (getPushSupport() === "unsupported" || isIosStandaloneRequired()) {
      setIosHintNeeded(isIosStandaloneRequired());
      return;
    }

    setRemindersPending(true);
    if (next) {
      const ok = await subscribeToPush(locale);
      setRemindersEnabled(ok);
    } else {
      await unsubscribeFromPush();
      setRemindersEnabled(false);
    }
    setRemindersPending(false);
  }

  function openResetDialog() {
    setResetChecked(false);
    setResetError(false);
    setResetDialogOpen(true);
  }

  function closeResetDialog() {
    setResetDialogOpen(false);
    setResetChecked(false);
    setResetError(false);
  }

  async function handleConfirmReset() {
    setResetting(true);
    setResetError(false);

    const response = await deviceFetch("/api/account/reset-cards", { method: "POST" });

    setResetting(false);

    if (!response.ok) {
      setResetError(true);
      return;
    }

    setResetDialogOpen(false);
    setResetChecked(false);
    setResetDone(true);
  }

  return (
    <div className="mx-auto w-full max-w-screen-sm px-4 pt-5 pb-6">
      <Logo size="md" className="mb-1" />
      <h1 className="font-brand text-[27px] leading-[1.15] font-extrabold tracking-[-0.02em]">
        {t("title")}
      </h1>

      <section className="mt-4 rounded-[22px] bg-gradient-to-br from-coral/35 to-mint/35 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-black/20">
            <Smartphone className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {isAuthenticated ? t("signedInCardTitle") : t("guestCardTitle")}
            </p>
            <p className="mt-0.5 text-sm text-foreground/70">
              {isAuthenticated ? t("signedInCardBody", { name }) : t("guestCardBody")}
            </p>
          </div>
        </div>

        {status === "loading" ? null : isAuthenticated ? (
          <Button type="button" variant="neutral" onClick={() => signOut()} className="mt-4 w-full bg-white/80 dark:bg-black/20">
            {t("signOutButton")}
          </Button>
        ) : (
          <Link
            href="/login"
            className={buttonClassName(
              "neutral",
              "mt-4 w-full justify-center gap-2 bg-white/80 dark:bg-black/20"
            )}
          >
            <LogIn className="size-4" aria-hidden />
            {t("signInButton")}
          </Link>
        )}

        <p className="mt-3 text-xs text-foreground/60">{t("signInHint")}</p>
      </section>

      <section className={`mt-4 divide-y divide-black/10 dark:divide-white/10 ${CARD_SURFACE_CLASS} p-0`}>
        <div className="flex flex-col gap-1.5 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell className="size-5 shrink-0 text-foreground/60" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("remindersLabel")}</p>
              <p className="text-xs text-foreground/60">{t("remindersHint")}</p>
            </div>
            <Switch
              checked={remindersEnabled}
              onChange={handleRemindersToggle}
              disabled={remindersPending}
              label={t("remindersLabel")}
            />
          </div>
          {iosHintNeeded && (
            <p className="pl-8 text-xs text-foreground/50">{t("iosInstallHint")}</p>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5">
          <Languages className="size-5 shrink-0 text-foreground/60" aria-hidden />
          <p className="flex-1 font-semibold">{t("languageLabel")}</p>
          <LocaleToggle />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5">
          <Sun className="size-5 shrink-0 text-foreground/60" aria-hidden />
          <p className="flex-1 font-semibold">{t("appearanceLabel")}</p>
          <AppearanceControl />
        </div>

        <Link
          href="/stats"
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <BarChart3 className="size-5 shrink-0 text-foreground/60" aria-hidden />
          <span className="flex-1 font-semibold">{t("statsRow")}</span>
          <ChevronRight className="size-4 shrink-0 text-foreground/40" aria-hidden />
        </Link>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <CircleHelp className="size-5 shrink-0 text-foreground/60" aria-hidden />
          <span className="flex-1 font-semibold">{t("helpRow")}</span>
          <ChevronRight className="size-4 shrink-0 text-foreground/40" aria-hidden />
        </button>
      </section>

      <section className={`mt-4 ${CARD_SURFACE_CLASS} border-status-urgent/30 p-4`}>
        <div className="flex items-start gap-3">
          <Trash2 className="size-5 shrink-0 text-status-urgent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("resetCardsRow")}</p>
            <p className="mt-0.5 text-xs text-foreground/60">{t("resetCardsHint")}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={openResetDialog}
          className="mt-3 w-full"
        >
          {t("resetCardsButton")}
        </Button>
        {resetDone && (
          <p className="mt-2 text-xs text-status-ok" role="status">
            {t("resetCardsSuccess")}
          </p>
        )}
      </section>

      <footer className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-foreground/70">
        <Logo size="sm" />
        <p>{tFooter("authorLine")}</p>
        <div className="flex items-center gap-1.5">
          <span>{tFooter("contactLabel")}:</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">
            {CONTACT_EMAIL}
          </a>
        </div>
        <span>{tFooter("versionLabel", { version: APP_VERSION })}</span>
      </footer>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ConfirmDialog
        open={resetDialogOpen}
        title={t("resetCardsDialogTitle")}
        body={resetError ? t("resetCardsDialogFailed") : t("resetCardsDialogBody")}
        confirmLabel={t("resetCardsDialogConfirm")}
        cancelLabel={t("resetCardsDialogCancel")}
        confirmDisabled={!resetChecked || resetting}
        onConfirm={handleConfirmReset}
        onCancel={closeResetDialog}
      >
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={resetChecked}
            onChange={(event) => setResetChecked(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-status-urgent"
          />
          {t("resetCardsDialogCheckboxLabel")}
        </label>
      </ConfirmDialog>
    </div>
  );
}
