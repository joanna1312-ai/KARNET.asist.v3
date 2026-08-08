import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountMenu } from "@/components/AccountMenu";
import { HelpMenu } from "@/components/HelpMenu";
import { SettingsMenu } from "@/components/SettingsMenu";

export async function Header() {
  const t = await getTranslations("header");

  return (
    <header className="flex min-h-[60px] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-black/10 px-4 py-2 dark:border-white/10">
      <Link
        href="/"
        aria-label={t("homeAria")}
        title={t("homeAria")}
        className="flex min-w-0 items-center gap-2"
      >
        <span className="size-2.5 shrink-0 rounded-full bg-accent" />
        <span className="truncate text-base font-bold tracking-tight">{t("brand")}</span>
      </Link>
      <nav className="flex min-w-0 items-center gap-1">
        <Link
          href="/companies"
          className="flex min-h-11 items-center truncate rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("companiesNav")}
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
