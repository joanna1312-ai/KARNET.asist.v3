"use client";

import { Bell, CircleDot, LogIn, Smartphone } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

const BULLETS = [
  { icon: CircleDot, key: "bullet1", bg: "bg-mint/25", fg: "text-mint-ink" },
  { icon: Bell, key: "bullet2", bg: "bg-coral/25", fg: "text-coral-ink" },
  { icon: Smartphone, key: "bullet3", bg: "bg-sky/25", fg: "text-sky" },
] as const;

export function OnboardingScreen() {
  const t = useTranslations("onboarding");

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-screen-sm flex-col justify-end px-4 pb-8">
      <div className="flex-1" />

      <Logo />

      <h1 className="mt-4 font-brand text-4xl leading-tight font-extrabold tracking-[-0.025em]">
        {t("title")}
      </h1>

      <p className="mt-4 text-foreground/70">{t("body")}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {BULLETS.map(({ icon: Icon, key, bg, fg }) => (
          <li key={key} className="flex items-start gap-3">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}>
              <Icon className="size-4" aria-hidden />
            </span>
            <p className="pt-1.5 font-medium">{t(key)}</p>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/cards/new"
          className="flex min-h-11 items-center justify-center rounded-full bg-mint px-4 py-3.5 text-base font-semibold text-mint-ink transition-colors duration-200 hover:brightness-95"
        >
          {t("primaryCta")}
        </Link>
        <Button
          type="button"
          variant="neutral"
          onClick={() => signIn("google")}
          className="justify-center gap-2 border border-black/10 py-3.5 text-base dark:border-white/15"
        >
          <LogIn className="size-4" aria-hidden />
          {t("secondaryCta")}
        </Button>
      </div>
    </div>
  );
}
