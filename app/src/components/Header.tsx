import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountMenu } from "@/components/AccountMenu";
import { HelpMenu } from "@/components/HelpMenu";
import { Logo } from "@/components/Logo";
import { SettingsMenu } from "@/components/SettingsMenu";

export async function Header() {
  const t = await getTranslations("header");

  return (
    <header className="hidden min-h-[60px] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-gradient-to-r from-coral/25 via-background to-mint/25 px-4 py-2 shadow-md md:flex">
      <Link
        href="/"
        aria-label={t("homeAria")}
        title={t("homeAria")}
        className="flex min-w-0 items-center"
      >
        <Logo />
      </Link>
      <nav className="flex min-w-0 items-center gap-1">
        <Link
          href="/companies"
          className="flex min-h-11 items-center truncate rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("companiesNav")}
        </Link>
        <Link
          href="/recommendations"
          className="flex min-h-11 items-center truncate rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("recommendationsNav")}
        </Link>
      </nav>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5">
        <AccountMenu />
        <HelpMenu />
        <SettingsMenu />
      </div>
    </header>
  );
}
