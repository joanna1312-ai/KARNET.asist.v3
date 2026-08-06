"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/i18n/locale";
import { locales, type Locale } from "@/i18n/locales";

export function LocaleToggle() {
  const t = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      aria-label={t("localeToggleAria")}
      className="flex shrink-0 gap-0.5 rounded-full bg-black/5 p-0.5 dark:bg-white/10"
    >
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => switchTo(option)}
          aria-pressed={locale === option}
          disabled={isPending}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide disabled:opacity-60 ${
            locale === option
              ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
