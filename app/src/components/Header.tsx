import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountMenu } from "@/components/AccountMenu";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function Header() {
  const t = await getTranslations("header");

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/10">
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
          className="truncate rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("companiesNav")}
        </Link>
      </nav>
      <div className="flex min-w-0 shrink-0 items-center gap-1.5">
        <AccountMenu />
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
